import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type { TOC } from '@ember/component/template-only';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import Icon from 'client-v2/components/icon';
import {
  REFERENCE_BASICS,
  REFERENCE_FUNCTIONS,
  REFERENCE_OPTIONS,
  REFERENCE_SECTION_IDS,
  type ReferenceEntry,
  type ReferenceOption,
  type ReferenceSectionId,
} from 'client-v2/help/reference-data';
import { REFERENCE_TEXT } from 'client-v2/help/reference-text';
import type HelpService from 'client-v2/services/help';

const COPIED_MS = 1500;

function isNone(list: readonly unknown[]): boolean {
  return list.length === 0;
}

/** Puts text on the clipboard: the clipboard API where there is one, else a hidden field and the old command. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    let done = false;
    try {
      done = document.execCommand('copy');
    } catch {
      done = false;
    }
    field.remove();
    return done;
  }
}

interface ExampleSignature {
  Args: {
    entry: ReferenceEntry;
    buttonText: (name: string) => string;
    buttonLabel: (name: string) => string;
    onCopy: (name: string, example: string) => void;
  };
}

const Example: TOC<ExampleSignature> = <template>
  <div class="reference__example">
    <pre aria-label={{REFERENCE_TEXT.exampleLabel}}><code
      >{{@entry.example}}</code></pre>
    <button
      type="button"
      class="btn btn--s"
      aria-label={{@buttonLabel @entry.name}}
      data-test-reference-copy={{@entry.name}}
      {{on "click" (fn @onCopy @entry.name @entry.example)}}
    >{{@buttonText @entry.name}}</button>
  </div>
</template>;

const OptionsTable: TOC<{
  Args: { rows: readonly ReferenceOption[] };
}> = <template>
  <div class="reference__table">
    <table class="reference__options">
      <caption class="sr-only">{{REFERENCE_TEXT.optionsHeading}}</caption>
      <thead>
        <tr>
          <th scope="col">{{REFERENCE_TEXT.optionName}}</th>
          <th scope="col">{{REFERENCE_TEXT.optionType}}</th>
          <th scope="col">{{REFERENCE_TEXT.optionMeaning}}</th>
        </tr>
      </thead>
      <tbody>
        {{#each @rows key="name" as |option|}}
          <tr>
            <td><code>{{option.name}}</code></td>
            <td><code>{{option.type}}</code></td>
            <td>{{option.description}}</td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
</template>;

const Entry: TOC<ExampleSignature> = <template>
  <section
    class="reference__entry"
    aria-label={{@entry.name}}
    data-test-reference-entry={{@entry.name}}
  >
    <h4 class="reference__name"><code>{{@entry.name}}</code></h4>
    <p class="reference__signature"><code>{{@entry.signature}}</code></p>
    <p>{{@entry.summary}}</p>
    {{#if @entry.sharedOptions}}
      <p class="reference__shared">{{REFERENCE_TEXT.sharedOptions}}</p>
    {{/if}}
    {{#unless (isNone @entry.options)}}
      <OptionsTable @rows={{@entry.options}} />
    {{/unless}}
    <Example
      @entry={{@entry}}
      @buttonText={{@buttonText}}
      @buttonLabel={{@buttonLabel}}
      @onCopy={{@onCopy}}
    />
  </section>
</template>;

/**
 * The script reference: every function a script can call (from reference-data.ts), with its options and
 * an example that can be copied, and the little of cracked-up the templates use.
 */
function entriesOf(section: ReferenceSectionId): readonly ReferenceEntry[] {
  return REFERENCE_FUNCTIONS.filter((entry) => entry.section === section);
}

export default class ScriptReference extends Component {
  @service declare help: HelpService;

  text = REFERENCE_TEXT;
  basics = REFERENCE_BASICS;
  options = REFERENCE_OPTIONS;
  sections = REFERENCE_SECTION_IDS.map((id) => ({
    id,
    label: REFERENCE_TEXT.sections[id],
  }));
  controls = entriesOf('controls');
  editors = entriesOf('editors');

  /** the section the scroll is in, marked in the row of links */
  @tracked current: ReferenceSectionId = 'controls';
  #scroller: HTMLElement | null = null;

  /** the sidebar takes focus as it appears when it was opened by the person, not restored by a reload */
  start = modifier((heading: HTMLElement) => {
    if (this.help.takeReferenceFocus()) heading.focus();
  });

  scroller = modifier((element: HTMLElement) => {
    this.#scroller = element;
    return () => (this.#scroller = null);
  });

  /** Scrolls the body to a section (at once: nothing moves but the body). */
  jump = (id: ReferenceSectionId): void => {
    const scroller = this.#scroller;
    const target = scroller?.querySelector<HTMLElement>(
      `[data-reference-section="${id}"]`,
    );
    if (!scroller || !target) return;
    scroller.scrollTop = target.offsetTop;
    this.current = id;
  };

  /** The current section is the last whose top has reached the top of the body. */
  scrolled = (): void => {
    const scroller = this.#scroller;
    if (!scroller) return;
    let current: ReferenceSectionId = REFERENCE_SECTION_IDS[0];
    const atEnd =
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
    for (const id of REFERENCE_SECTION_IDS) {
      const section = scroller.querySelector<HTMLElement>(
        `[data-reference-section="${id}"]`,
      );
      if (section && section.offsetTop <= scroller.scrollTop + 1) current = id;
    }
    // (the last section may be too short to reach the top: at the end of the body it is the current one)
    this.current = atEnd && scroller.scrollTop > 0 ? 'basics' : current;
  };

  isCurrent = (id: ReferenceSectionId): boolean => this.current === id;

  /** Escape, with focus inside: closes (the sidebar is not modal, so elsewhere Escape is the page's) */
  escape = modifier((element: HTMLElement) => {
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        this.close();
      }
    };
    element.addEventListener('keydown', onKeydown);
    return () => element.removeEventListener('keydown', onKeydown);
  });

  /** the entry whose Copy was just pressed, and how it went, for a moment */
  @tracked copied: { name: string; ok: boolean } | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;

  willDestroy(): void {
    super.willDestroy();
    clearTimeout(this.#timer);
  }

  copy = async (name: string, example: string): Promise<void> => {
    const ok = await copyText(example);
    this.copied = { name, ok };
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => (this.copied = null), COPIED_MS);
  };

  copyText = (name: string): string => {
    if (this.copied?.name !== name) return REFERENCE_TEXT.copy;
    return this.copied.ok ? REFERENCE_TEXT.copied : REFERENCE_TEXT.copyFailed;
  };

  copyLabel = (name: string): string => REFERENCE_TEXT.copyLabel(name);

  close = (): void => this.help.closeReference();

  <template>
    <aside
      class="reference"
      aria-labelledby="reference-title"
      data-test-reference
      {{this.escape}}
    >
      <header class="reference__head">
        <h2
          class="reference__title"
          id="reference-title"
          tabindex="-1"
          data-test-reference-title
          {{this.start}}
        >{{this.text.title}}</h2>
        <button
          type="button"
          class="icon-btn reference__close"
          aria-label={{this.text.close}}
          data-test-reference-close
          {{on "click" this.close}}
        ><Icon @name="cancel" /></button>
      </header>
      <nav class="reference__nav" aria-label={{this.text.navLabel}}>
        {{#each this.sections key="id" as |section|}}
          <button
            type="button"
            class="reference__link"
            aria-current={{if (this.isCurrent section.id) "true"}}
            data-test-reference-link={{section.id}}
            {{on "click" (fn this.jump section.id)}}
          >{{section.label}}</button>
        {{/each}}
      </nav>
      <div
        class="reference__body"
        data-test-reference-body
        {{this.scroller}}
        {{on "scroll" this.scrolled}}
      >
        <p class="reference__intro">{{this.text.intro}}</p>

        <section
          class="reference__section"
          aria-labelledby="reference-controls"
          data-reference-section="controls"
          data-test-reference-section="controls"
        >
          <h3
            class="reference__heading"
            id="reference-controls"
          >{{this.text.sections.controls}}</h3>
          <p>{{this.text.controlsIntro}}</p>
          {{#each this.controls key="name" as |entry|}}
            <Entry
              @entry={{entry}}
              @buttonText={{this.copyText}}
              @buttonLabel={{this.copyLabel}}
              @onCopy={{this.copy}}
            />
          {{/each}}
        </section>

        <section
          class="reference__section"
          aria-labelledby="reference-editors"
          data-reference-section="editors"
          data-test-reference-section="editors"
        >
          <h3
            class="reference__heading"
            id="reference-editors"
          >{{this.text.sections.editors}}</h3>
          <p>{{this.text.editorsIntro}}</p>
          {{#each this.editors key="name" as |entry|}}
            <Entry
              @entry={{entry}}
              @buttonText={{this.copyText}}
              @buttonLabel={{this.copyLabel}}
              @onCopy={{this.copy}}
            />
          {{/each}}
        </section>

        <section
          class="reference__section"
          aria-labelledby="reference-options"
          data-reference-section="options"
          data-test-reference-section="options"
        >
          <h3
            class="reference__heading"
            id="reference-options"
          >{{this.text.sections.options}}</h3>
          <p>{{this.text.optionsIntro}}</p>
          <OptionsTable @rows={{this.options}} />
        </section>

        <section
          class="reference__section"
          aria-labelledby="reference-basics"
          data-reference-section="basics"
          data-test-reference-section="basics"
        >
          <h3
            class="reference__heading"
            id="reference-basics"
          >{{this.text.sections.basics}}</h3>
          <div class="reference__entry" data-test-reference-basics>
            <p>{{this.text.basicsIntro}}</p>
            <p class="reference__signature"><code
              >{{this.basics.signature}}</code></p>
            <p>{{this.basics.summary}}</p>
            <Example
              @entry={{this.basics}}
              @buttonText={{this.copyText}}
              @buttonLabel={{this.copyLabel}}
              @onCopy={{this.copy}}
            />
            <p>
              <a
                href={{this.text.docsUrl}}
                target="_blank"
                rel="noopener noreferrer"
                data-test-reference-docs
              >{{this.text.docsLink}}</a>
            </p>
          </div>
        </section>
      </div>
    </aside>
  </template>
}
