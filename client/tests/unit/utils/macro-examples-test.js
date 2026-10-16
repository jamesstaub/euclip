import { module, test } from 'qunit';
import { MACRO_EXAMPLES } from 'euclip/utils/macros/library';

module('Unit | Utility | macro examples', function () {
  test("the examples use cracked's algorithmic helpers rather than their own randomness", function (assert) {
    MACRO_EXAMPLES.forEach((macro) => {
      [macro.initScript, macro.onstepScript, macro.projectScript].forEach(
        (script) => {
          assert.notOk(
            /Math\.random/.test(script),
            `${macro.key}: no Math.random (use __.random, __.chance, __.shuffle)`
          );
        }
      );
    });
  });

  test('the play scripts for the synths pick their notes with cracked scales or chords', function (assert) {
    const onstep = (key) =>
      MACRO_EXAMPLES.find((m) => m.key === key).onstepScript;
    assert.ok(/__\.scales\(/.test(onstep('polysynth')), 'polysynth: __.scales');
    assert.ok(/__\.scales\(/.test(onstep('monosynth')), 'monosynth: __.scales');
    assert.ok(/__\.chords\(/.test(onstep('siren')), 'siren: __.chords');
  });
});
