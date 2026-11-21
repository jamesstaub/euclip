import type { TOC } from '@ember/component/template-only';
import { htmlSafe } from '@ember/template';
import type { SafeString } from '@ember/template';
import addBefore from 'client-v2/assets/icons/add-before.svg?raw';
import addAfter from 'client-v2/assets/icons/add-after.svg?raw';
import insertHere from 'client-v2/assets/icons/insert-here.svg?raw';
import moveLeft from 'client-v2/assets/icons/move-left.svg?raw';
import moveRight from 'client-v2/assets/icons/move-right.svg?raw';
import removeNode from 'client-v2/assets/icons/remove-node.svg?raw';
import modulate from 'client-v2/assets/icons/modulate.svg?raw';
import addChain from 'client-v2/assets/icons/add-chain.svg?raw';
import send from 'client-v2/assets/icons/send.svg?raw';
import branch from 'client-v2/assets/icons/branch.svg?raw';
import reroute from 'client-v2/assets/icons/reroute.svg?raw';
import retarget from 'client-v2/assets/icons/retarget.svg?raw';
import arrow from 'client-v2/assets/icons/arrow.svg?raw';
import automation from 'client-v2/assets/icons/automation.svg?raw';
import cancel from 'client-v2/assets/icons/fi-cancel.svg?raw';
import chain from 'client-v2/assets/icons/chain.svg?raw';
import chevron from 'client-v2/assets/icons/chevron.svg?raw';
import code from 'client-v2/assets/icons/fi-code.svg?raw';
import dots from 'client-v2/assets/icons/fi-dots.svg?raw';
import multislider from 'client-v2/assets/icons/multislider.svg?raw';
import play from 'client-v2/assets/icons/fi-play.svg?raw';
import search from 'client-v2/assets/icons/search.svg?raw';
import snapshots from 'client-v2/assets/icons/snapshots.svg?raw';
import sound from 'client-v2/assets/icons/fi-sound.svg?raw';
import squares from 'client-v2/assets/icons/fi-squares.svg?raw';
import stop from 'client-v2/assets/icons/fi-stop.svg?raw';

/**
 * The SVG files in app/assets/icons are copied unchanged from the v1 app, except arrow, chevron and
 * search, which v1 drew with text characters and are new here, and multislider, whose viewBox is cropped
 * to its bars (v1's left most of its box empty). They are inlined (not <img>) so they
 * take the colour of the text around them. Before that, the parts that only make sense in a standalone file
 * are dropped: the XML prolog and comments, fixed sizes, ids (which would repeat on the page), inline styles
 * and empty groups.
 */
function inline(svg: string): SafeString {
  const start = svg.indexOf('<svg');
  const end = svg.indexOf('>', start);
  const root = svg
    .slice(start, end)
    .replace(/\s(?:id|x|y|width|height|style|version|xml:space)="[^"]*"/g, '');
  const body = svg
    .slice(end)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<g>\s*<\/g>/g, '');
  // the markup is our own static asset, bundled at build time: nothing a user typed reaches here
  return htmlSafe(`${root} aria-hidden="true" focusable="false"${body}`.trim());
}

const ICONS = {
  addBefore: inline(addBefore),
  addAfter: inline(addAfter),
  insertHere: inline(insertHere),
  moveLeft: inline(moveLeft),
  moveRight: inline(moveRight),
  removeNode: inline(removeNode),
  modulate: inline(modulate),
  addChain: inline(addChain),
  reroute: inline(reroute),
  send: inline(send),
  branch: inline(branch),
  retarget: inline(retarget),
  arrow: inline(arrow),
  automation: inline(automation),
  cancel: inline(cancel),
  chain: inline(chain),
  chevron: inline(chevron),
  code: inline(code),
  dots: inline(dots),
  multislider: inline(multislider),
  play: inline(play),
  search: inline(search),
  snapshots: inline(snapshots),
  sound: inline(sound),
  squares: inline(squares),
  stop: inline(stop),
} as const;

export type IconName = keyof typeof ICONS;

function markup(name: IconName): SafeString {
  return ICONS[name];
}

export interface IconSignature {
  Element: HTMLSpanElement;
  Args: {
    name: IconName;
  };
}

/**
 * A decorative icon, 1.25rem square unless a class says otherwise (see .icon in styles/buttons.css).
 * It is hidden from assistive tech: name the button it sits in.
 */
const Icon: TOC<IconSignature> = <template>
  <span class="icon" aria-hidden="true" ...attributes>{{markup @name}}</span>
</template>;

export default Icon;
