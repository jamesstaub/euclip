import type { TourStepId } from 'client-v2/help/tour-text';
import type ViewService from 'client-v2/services/view';

/**
 * The tour's steps: which element each points at (a selector on the page as it is) and, where what is
 * needed is not on screen, how to bring it there by the view service's own calls. A step whose element
 * is still not on screen is skipped.
 */
export interface TourStep {
  id: TourStepId;
  target: string;
  prepare?: (view: ViewService) => void;
}

export const TOUR_STEPS: readonly TourStep[] = [
  { id: 'track', target: '.track__row' },
  {
    id: 'grid',
    target: '.track__grid',
    // (the rows show signal chains, not steps: back to steps so there is a grid to point at)
    prepare: (view) => view.setRowsView('steps'),
  },
  { id: 'tabs', target: '.footer-tabs' },
  { id: 'view', target: '.project-bar__view' },
  { id: 'script', target: '.track-footer__script-btn' },
  { id: 'menu', target: '.project-menu__button' },
];

/** The first element matching the selector that is on screen (has a size), or null. */
export function findTarget(selector: string): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const box = element.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return element;
  }
  return null;
}
