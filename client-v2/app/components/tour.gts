import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { waitForPromise } from '@ember/test-waiters';
import { service } from '@ember/service';
import { modifier } from 'ember-modifier';
import { findTarget } from 'client-v2/help/tour';
import { TOUR_STEP_TEXTS, TOUR_TEXT } from 'client-v2/help/tour-text';
import dialogFocus from 'client-v2/modifiers/dialog-focus';
import type HelpService from 'client-v2/services/help';
import type ViewService from 'client-v2/services/view';

/** Space kept between the card and the screen's edge, and between the card and what it points at, in px. */
const MARGIN = 8;

/**
 * The tour: one step at a time, an outline round the element it points at and a card that says what it
 * is. The outline is a box of its own laid over the element (it never changes the element, and nothing
 * is moved or resized). On a phone the card is a strip at the bottom of the screen, or at the top when
 * the element it points at is down there. Where the element is not on screen the step is passed.
 */
export default class Tour extends Component {
  @service declare help: HelpService;
  @service declare view: ViewService;

  text = TOUR_TEXT;

  get step() {
    const step = this.help.tourStep;
    return step ? { ...TOUR_STEP_TEXTS[step.id], id: step.id } : null;
  }

  get count(): string {
    return TOUR_TEXT.stepCount(
      (this.help.tourIndex ?? 0) + 1,
      this.help.steps.length,
    );
  }

  get nextLabel(): string {
    return this.help.tourLast ? TOUR_TEXT.done : TOUR_TEXT.next;
  }

  next = (): void => {
    if (this.help.tourLast) this.help.closeTour();
    else this.help.tourNext();
  };
  back = (): void => this.help.tourBack();
  close = (): void => this.help.closeTour();

  /** Finds what the step points at, outlines it, and puts the card where it covers neither it nor the screen's edge. */
  aim = modifier((card: HTMLElement, [index]: [number | null]) => {
    void index;
    const selector = this.help.tourStep?.target;
    if (!selector) return;
    const place = (): void => {
      const target = findTarget(selector);
      if (!target) {
        // nothing on screen to point at: pass the step (after this render, not in it)
        void waitForPromise(Promise.resolve().then(() => this.help.tourSkip()));
        return;
      }
      const box = target.getBoundingClientRect();
      // (set on the elements themselves: they are measured, not rendered from state)
      const mark =
        card.parentElement?.querySelector<HTMLElement>('.tour__mark');
      if (mark) {
        mark.style.left = `${Math.round(box.left)}px`;
        mark.style.top = `${Math.round(box.top)}px`;
        mark.style.width = `${Math.round(box.width)}px`;
        mark.style.height = `${Math.round(box.height)}px`;
      }
      const view = window.visualViewport;
      const width = view?.width ?? window.innerWidth;
      const height = view?.height ?? window.innerHeight;
      const size = card.getBoundingClientRect();
      if (this.view.phone) {
        const strip = size.height + MARGIN;
        card.dataset['place'] = box.bottom > height - strip ? 'top' : 'bottom';
        card.style.left = '';
        card.style.top = '';
        return;
      }
      card.dataset['place'] = 'free';
      const left = Math.max(
        MARGIN,
        Math.min(box.left, width - size.width - MARGIN),
      );
      const below = box.bottom + MARGIN;
      const above = box.top - MARGIN - size.height;
      let top: number;
      if (below + size.height <= height - MARGIN) top = below;
      else if (above >= MARGIN) top = above;
      else top = Math.max(MARGIN, height - size.height - MARGIN);
      card.style.left = `${Math.round(left)}px`;
      card.style.top = `${Math.round(top)}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  });

  <template>
    {{#if this.step}}
      <div class="tour">
        <div class="tour__mark" aria-hidden="true" data-test-tour-mark></div>
        <section
          class="tour__card"
          role="dialog"
          aria-label={{this.text.dialogLabel}}
          data-test-tour
          data-test-tour-step={{this.step.id}}
          {{this.aim this.help.tourIndex}}
          {{dialogFocus onClose=this.close returnTo=this.help.opener}}
        >
          <p class="tour__count" data-test-tour-count>{{this.count}}</p>
          <div aria-live="polite">
            <h2 class="tour__title">{{this.step.title}}</h2>
            <p class="tour__body">{{this.step.body}}</p>
          </div>
          <div class="tour__actions">
            <button
              type="button"
              class="btn btn--s btn--ghost"
              data-test-tour-close
              {{on "click" this.close}}
            >{{this.text.close}}</button>
            <button
              type="button"
              class="btn btn--s"
              disabled={{this.help.tourFirst}}
              data-test-tour-back
              {{on "click" this.back}}
            >{{this.text.back}}</button>
            <button
              type="button"
              class="btn btn--s btn--solid"
              data-autofocus
              data-test-tour-next
              {{on "click" this.next}}
            >{{this.nextLabel}}</button>
          </div>
        </section>
      </div>
    {{/if}}
  </template>
}
