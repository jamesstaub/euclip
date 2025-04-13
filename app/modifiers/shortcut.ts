import { modifier } from 'ember-modifier';


type ModifierKey = 'meta' | 'control' | 'shift' | 'alt';
type ArrowKey = 'arrowup' | 'arrowdown' | 'arrowleft' | 'arrowright';
type LiteralKey =
  | 'escape'
  | 'enter'
  | 'tab'
  | 'space'
  | 'backspace'
  | 'delete'
  | 'capslock'
  | 'home'
  | 'end'
  | 'pagedown'
  | 'pageup';

type AlphaKey = Lowercase<
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'
  | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
>;

type DigitKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type ValidKey = ModifierKey | ArrowKey | LiteralKey | AlphaKey | DigitKey;



type ShortcutHandlerArgs = [shortcut: string, handler: () => void];
type ShortcutHandlerNamedArgs = { global: boolean };


const platformKey = navigator.platform.includes('Mac') ? 'Meta' : 'Control';

const keyMap: Record<string, string> = {
  Command: platformKey,
  Ctrl: 'Control',
};

const normalizeKey = (key: string): string =>
  key.startsWith('Arrow') ? key : key.toLowerCase();

const parseShortcut = (shortcut: string): ValidKey[] => {
  return shortcut
    .split('+')
    .map((key) => key.trim())
    .map((key) => keyMap[key] || key)
    .map(normalizeKey) as ValidKey[];
};


export default modifier(
  (element, [shortcut, handler]: ShortcutHandlerArgs, { global }: ShortcutHandlerNamedArgs) => {
    const shortcutKeys = parseShortcut(shortcut);

    const handleKeydown = (event: KeyboardEvent) => {
      if (!global && !element.contains(document.activeElement)) return;

      const pressedKeys = new Set<ValidKey>();

      if (event.metaKey) pressedKeys.add('meta');
      if (event.ctrlKey) pressedKeys.add('control');
      if (event.shiftKey) pressedKeys.add('shift');
      if (event.altKey) pressedKeys.add('alt');

      pressedKeys.add(normalizeKey(event.key) as ValidKey);

      const isMatch = shortcutKeys.every((key) => pressedKeys.has(key));
      if (isMatch) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return (): void => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }
);
