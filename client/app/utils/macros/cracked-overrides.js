/**
 * Schema-ready versions of cracked's built-in macros.
 *
 * Every macro that has a control schema (utils/macros/library) must answer
 * `__().<macro>('update', { setting: value })` for every setting in its schema; that is how a control
 * reaches the audio. cracked's polysynth already has `update`, but not for every setting, and its
 * monosynth has none, so those two are wrapped here. Everything else passes straight to cracked's own
 * implementation.
 *
 * These replace the functions cracked's plugins/synths.cracked.js defines, at app boot (see
 * initializers/macros.js).
 */

// the inner nodes of a monosynth, by the name its plugin gives them (see `el.search(...)` there)
function updateMonosynth(changes) {
  const cracked = window.cracked;

  cracked.each('monosynth', (el) => {
    const settings = el.getParams().settings;
    Object.assign(settings, changes);

    const inner = (name) => el.search(name);
    const apply = (method, value, name) => cracked.exec(method, [value], inner(name));

    Object.entries(changes).forEach(([setting, value]) => {
      switch (setting) {
        case 'osc_frequency': return apply('frequency', value, 'osc');
        case 'osc_detune': return apply('detune', value, 'osc');
        case 'osc_type': return apply('type', value, 'osc');
        case 'lp_frequency': return apply('frequency', value, 'lowpass');
        case 'lp_q': return apply('q', value, 'lowpass');
        case 'lfo_speed': return apply('frequency', value, 'lfo');
        case 'lfo_intensity': return apply('volume', value, 'lfo');
        case 'lfo_type': return apply('type', value, 'lfo');
        case 'gain_volume': return apply('volume', value, 'gain');
        case 'adsr_envelope':
          // the envelope's total time is read from the node's settings every time it is triggered
          return inner('adsr').forEach((id) => {
            const adsr = cracked._getNode(id);
            if (adsr) adsr.getParams().settings.envelope = value;
          });
        default:
      }
    });
  });
}

export function registerMacroOverrides(cracked = window.cracked) {
  if (!cracked || cracked.__macroOverridesRegistered) return;
  cracked.__macroOverridesRegistered = true;

  // monosynth: add `update`
  const monosynth = cracked.monosynth;
  cracked.monosynth = function (params) {
    if (params === 'update') {
      updateMonosynth(arguments[1] || {});
      return cracked;
    }
    return monosynth.apply(this, arguments);
  };

  // polysynth: its `update` leaves `gain_volume` (the output level) out
  const polysynth = cracked.polysynth;
  cracked.polysynth = function (params) {
    const result = polysynth.apply(this, arguments);
    if (params === 'update' && arguments[1] && arguments[1].gain_volume !== undefined) {
      const volume = arguments[1].gain_volume;
      cracked.each('polysynth', (el) => cracked.exec('volume', [volume], el.search('gain')));
    }
    return result;
  };
}
