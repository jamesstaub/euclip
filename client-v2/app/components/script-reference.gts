import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Dialog from 'client-v2/components/ui/dialog';
import {
  REFERENCE_BASICS,
  REFERENCE_FUNCTIONS,
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

/**
 * The script reference: every function a script can call (from reference-data.ts), with its options and
 * an example that can be copied, and the little of cracked-up the templates use.
 */
export default class ScriptReference extends Component {
  @service declare help: HelpService;

  text = REFERENCE_TEXT;
  functions = REFERENCE_FUNCTIONS;
  basics = REFERENCE_BASICS;

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
    <Dialog
      class="reference"
      @title={{this.text.title}}
      @closeLabel={{this.text.close}}
      @onClose={{this.close}}
      @returnTo={{this.help.opener}}
      data-test-reference
    >
      <p class="reference__intro">{{this.text.intro}}</p>

      <h3 class="reference__heading">{{this.text.functionsHeading}}</h3>
      {{#each this.functions key="name" as |entry|}}
        <section
          class="reference__entry"
          aria-label={{entry.name}}
          data-test-reference-entry={{entry.name}}
        >
          <h4 class="reference__name"><code>{{entry.name}}</code></h4>
          <p class="reference__signature"><code>{{entry.signature}}</code></p>
          <p>{{entry.summary}}</p>
          {{#unless (isNone entry.options)}}
            <table class="reference__options">
              <caption class="sr-only">{{this.text.optionsHeading}}</caption>
              <thead>
                <tr>
                  <th scope="col">{{this.text.optionName}}</th>
                  <th scope="col">{{this.text.optionType}}</th>
                  <th scope="col">{{this.text.optionMeaning}}</th>
                </tr>
              </thead>
              <tbody>
                {{#each entry.options key="name" as |option|}}
                  <tr>
                    <td><code>{{option.name}}</code></td>
                    <td><code>{{option.type}}</code></td>
                    <td>{{option.description}}</td>
                  </tr>
                {{/each}}
              </tbody>
            </table>
          {{/unless}}
          <div class="reference__example">
            <pre aria-label={{this.text.exampleLabel}}><code
              >{{entry.example}}</code></pre>
            <button
              type="button"
              class="btn btn--s"
              aria-label={{this.copyLabel entry.name}}
              data-test-reference-copy={{entry.name}}
              {{on "click" (fn this.copy entry.name entry.example)}}
            >{{this.copyText entry.name}}</button>
          </div>
        </section>
      {{/each}}

      <h3 class="reference__heading">{{this.text.basicsHeading}}</h3>
      <section class="reference__entry" data-test-reference-basics>
        <p>{{this.text.basicsIntro}}</p>
        <p class="reference__signature"><code
          >{{this.basics.signature}}</code></p>
        <p>{{this.basics.summary}}</p>
        <div class="reference__example">
          <pre aria-label={{this.text.exampleLabel}}><code
            >{{this.basics.example}}</code></pre>
          <button
            type="button"
            class="btn btn--s"
            aria-label={{this.copyLabel this.basics.name}}
            data-test-reference-copy={{this.basics.name}}
            {{on "click" (fn this.copy this.basics.name this.basics.example)}}
          >{{this.copyText this.basics.name}}</button>
        </div>
        <p>
          <a
            href={{this.text.docsUrl}}
            target="_blank"
            rel="noopener noreferrer"
            data-test-reference-docs
          >{{this.text.docsLink}}</a>
        </p>
      </section>
    </Dialog>
  </template>
}
