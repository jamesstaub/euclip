/**
 * Switches for behaviour that is still being decided. Each is one constant, read where the behaviour
 * starts, so turning it off removes the behaviour whole.
 */

/**
 * Whether the sound a sampler plays can be chosen in the source pane and kept in the project.
 *
 * On: the source pane has a sound picker (and the sidebar's "Use" sets the same thing). The choice is
 * stored like any control's value, under the sampler's `buffer` key, and applied by the script's
 * `waveform(...)` declaration when the script runs; the `buffer: 'kick'` in the code is the default,
 * and Reset returns to it.
 *
 * Off: the script's `buffer` is what plays, always. The picker is hidden (the pane still names the
 * sound), "Use" does nothing to samplers, and a choice already stored is left alone and ignored.
 */
export const STORED_BUFFER_CHOICE = true;
