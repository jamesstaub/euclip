
import { modifier } from 'ember-modifier';

/**
 * 
 * modifier to handle keyboard shortcuts
 * 
 * should be used on the highest focused element that you'd want to capture the shortcut on
 * 
 */

export default modifier((element, [shortcut, handler]: [string, () => void], { global }: { global: boolean }) => {
  const platformKey = navigator.platform.includes('Mac') ? 'Meta' : 'Control';

  const parseShortcut = (shortcut: string) => {
    return shortcut
      .replace(/Command/g, platformKey)
      .replace(/Ctrl/g, 'Control')
      .replace(/ArrowUp/g, 'ArrowUp')
      .replace(/ArrowDown/g, 'ArrowDown')
      .replace(/ArrowLeft/g, 'ArrowLeft')
      .replace(/ArrowRight/g, 'ArrowRight')
      .split('+')
      .map((key) => key.trim().toLowerCase());
  };

  const shortcutKeys = parseShortcut(shortcut);
  
  const handleKeydown = (event: KeyboardEvent) => {
    
    if (!global && !element.contains(document.activeElement)) {
      return;
    }

    const pressedKeys = new Set<string>();
    if (event.metaKey) pressedKeys.add('meta');
    if (event.ctrlKey) pressedKeys.add('control');
    if (event.shiftKey) pressedKeys.add('shift');
    if (event.altKey) pressedKeys.add('alt');
    // escape
    if (event.key === 'Escape') pressedKeys.add('escape');
    pressedKeys.add(event.key.toLowerCase());

    const normalizedKey = event.key.startsWith('Arrow') ? event.key : event.key.toLowerCase();
    pressedKeys.add(normalizedKey);

    const isMatch = shortcutKeys.every((key) => pressedKeys.has(key));
    if (isMatch) {
      event.preventDefault();
      handler();
    }
  };

  window.addEventListener('keydown', handleKeydown);

  return () => {
    window.removeEventListener('keydown', handleKeydown);
  };
});