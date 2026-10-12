/**
 * Control schemas for macros (cracked instruments built from several audio nodes, such as the
 * polysynth). A macro's own parameters ("settings") are what the user controls, not its inner nodes,
 * which may not exist yet or come and go (a polysynth makes a voice per note). A schema says which
 * settings are controls and how to present them; euclip builds the track controls and UI from it.
 */

/** What a setting is *for*. Surfaces choose their UI by role (e.g. a pitch gets a keyboard). */
export type MacroControlRole =
  | 'pitch'
  | 'level'
  | 'timbre'
  | 'filter'
  | 'envelope'
  | 'modulation';

export interface MacroControlSpec {
  /** shown above the control; defaults to the setting's name */
  label?: string;
  role?: MacroControlRole;
  /** 'choice' settings hold an index into `choices`; the macro receives the chosen string */
  type?: 'number' | 'choice';
  /** the unit shown under the label, e.g. 'Hz' or 'Seconds' */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  scale?: 'linear' | 'log';
  /** the starting value (an index for a choice); matches the macro's own default unless noted */
  default: number;
  choices?: string[];
  description?: string;
}

/** setting name -> how it is controlled */
export type MacroSchema = Record<string, MacroControlSpec>;

export interface MacroDefinition {
  /** the cracked macro's name: `__().polysynth(...)` */
  key: string;
  title: string;
  description: string;
  schema: MacroSchema;
  /**
   * What the Macros menu adds to the project's macros script (once): the macro's registration and control
   * schema, documented. Starts with a marker line (`macroMarker(key)`), which is how "already added" is known.
   */
  projectScript: string;
  /** the example the Macros menu loads into the track's setup script: just using the macro */
  initScript: string;
  /** ...and into the play script */
  onstepScript: string;
}

/** A schema with the script's declared changes (`this.declareControls(...)`) applied on top. */
export function mergeSchema(base: MacroSchema, declared?: Partial<Record<string, Partial<MacroControlSpec>>>): MacroSchema {
  if (!declared) return base;
  const merged: MacroSchema = { ...base };
  Object.entries(declared).forEach(([key, changes]) => {
    if (!changes) return;
    // an unknown key adds a new control; a known one is adjusted
    merged[key] = { ...(base[key] ?? { default: 0 }), ...changes };
  });
  return merged;
}

/** The numbers a control needs, filled in from the spec (a choice is a 0..n-1 index with step 1). */
export function resolveSpec(spec: MacroControlSpec) {
  if (spec.type === 'choice') {
    const count = spec.choices?.length ?? 1;
    return { min: 0, max: Math.max(count - 1, 0), stepSize: 1, defaultValue: spec.default, unit: spec.unit ?? 'Choice' };
  }
  const min = spec.min ?? 0;
  const max = spec.max ?? 1;
  return {
    min,
    max,
    stepSize: spec.step ?? (max - min) / 100,
    defaultValue: spec.default,
    unit: spec.unit ?? 'Value',
  };
}

/** For a choice, the index of a string the script passed (e.g. osc_type: 'square'), if it is one of the choices. */
export function choiceIndex(spec: MacroControlSpec | undefined, value: unknown): number | undefined {
  if (!spec?.choices || typeof value !== 'string') return undefined;
  const index = spec.choices.indexOf(value);
  return index >= 0 ? index : undefined;
}

/** The line a macro's snippet in the macros script starts with. */
export const macroMarker = (key: string) => `// ---- macro: ${key} ----`;

/** `current` with the macro's snippet added at the end, unless it is already in there. */
export function withMacroSnippet(current: string, macro: Pick<MacroDefinition, 'key' | 'projectScript'>): string {
  if (current.includes(macroMarker(macro.key))) return current;
  return `${current.trimEnd()}\n\n${macro.projectScript}`;
}
