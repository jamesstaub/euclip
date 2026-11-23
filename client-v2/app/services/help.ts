import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isTesting, macroCondition } from '@embroider/macros';
import { TOUR_STEPS, type TourStep } from 'client-v2/help/tour';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

/**
 * What help is showing now: the welcome dialog, the tour (which step), the script reference. Nothing
 * here is the project's or remembered, except that the welcome has been shown (the view's).
 *
 * `opener` is where focus goes back to when a help panel closes: the control that opened it, which may
 * itself have gone (a menu item), so it is the menu's button.
 */
export default class HelpService extends Service {
  @service declare view: ViewService;
  @service declare project: ProjectService;

  /**
   * Whether the welcome may appear at all. Off in tests (a first visit is every test's start), which
   * turn it on when they are about it.
   */
  welcomeEnabled: boolean = macroCondition(isTesting()) ? false : true;

  @tracked welcomeOpen = false;
  @tracked referenceOpen = false;
  /** the tour's current step (an index into the steps), or null when it is not running */
  @tracked tourIndex: number | null = null;
  opener: HTMLElement | null = null;
  /** which way the tour was going, so that a step with nothing to point at is passed in that direction */
  #direction: 1 | -1 = 1;

  steps: readonly TourStep[] = TOUR_STEPS;

  /**
   * After the project has loaded: on a browser's first visit (nothing was saved, and the welcome has
   * not been shown) opens the welcome. It is marked seen as it opens, so a reload never shows it twice.
   */
  considerWelcome(): void {
    if (!this.welcomeEnabled || this.view.welcomeSeen) return;
    if (this.project.restored) return;
    this.openWelcome(null);
  }

  openWelcome(opener: HTMLElement | null): void {
    this.opener = opener;
    this.view.markWelcomeSeen();
    this.welcomeOpen = true;
  }

  closeWelcome(): void {
    this.welcomeOpen = false;
  }

  openReference(opener: HTMLElement | null): void {
    this.opener = opener;
    this.referenceOpen = true;
  }

  closeReference(): void {
    this.referenceOpen = false;
  }

  // --- the tour -------------------------------------------------------------------------------------

  startTour(opener: HTMLElement | null): void {
    this.opener = opener;
    this.#direction = 1;
    this.#enter(0);
  }

  get tourStep(): TourStep | null {
    return this.tourIndex === null
      ? null
      : (this.steps[this.tourIndex] ?? null);
  }

  get tourFirst(): boolean {
    return this.tourIndex === 0;
  }

  get tourLast(): boolean {
    return this.tourIndex === this.steps.length - 1;
  }

  tourNext(): void {
    if (this.tourIndex === null) return;
    this.#direction = 1;
    this.#enter(this.tourIndex + 1);
  }

  tourBack(): void {
    if (this.tourIndex === null) return;
    this.#direction = -1;
    this.#enter(this.tourIndex - 1);
  }

  /** The step shown has nothing on screen to point at: on to the next in the way the tour was going. */
  tourSkip(): void {
    if (this.tourIndex === null) return;
    this.#enter(this.tourIndex + this.#direction, this.tourIndex);
  }

  closeTour(): void {
    this.tourIndex = null;
  }

  #enter(index: number, from?: number): void {
    if (index >= this.steps.length) {
      this.tourIndex = null;
      return;
    }
    if (index < 0) {
      // nothing before: stay where it was, or begin again at the first that can be shown
      if (from === undefined) return;
      this.#direction = 1;
      index = 0;
    }
    this.steps[index]?.prepare?.(this.view);
    this.tourIndex = index;
  }
}

declare module '@ember/service' {
  interface Registry {
    help: HelpService;
  }
}
