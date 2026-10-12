import { module, test } from 'qunit';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';
import { SCRIPT_SCOPE_DOCS } from 'euclip/utils/script-scope-docs';
import { crackedCompletionSource } from 'euclip/utils/autocomplete/source';

function complete(doc) {
  const state = EditorState.create({ doc });
  return crackedCompletionSource(
    new CompletionContext(state, doc.length, false)
  );
}

const labels = (result) => result.options.map((o) => o.label);
const top = (result, n = 3) =>
  [...result.options]
    .sort((a, b) => (b.boost ?? 0) - (a.boost ?? 0))
    .slice(0, n)
    .map((o) => o.label);

module('Unit | Utility | cracked autocomplete', function () {
  test('a new chain suggests sound sources first', function (assert) {
    assert.ok(top(complete('__().'), 5).includes('sampler'));
  });

  test('after a source, effects and dac are suggested', function (assert) {
    const result = complete('__().sampler().');
    assert.ok(top(result, 3).includes('dac'));
    assert.ok(top(result, 10).includes('lowpass'));
  });

  test('after a selector, setters come first', function (assert) {
    assert.ok(top(complete('__("#kick").'), 3).includes('frequency'));
  });

  test('this. completes every documented track scope property', function (assert) {
    const options = labels(complete('this.'));
    const missing = SCRIPT_SCOPE_DOCS.map((d) => d.name).filter(
      (name) => !options.includes(name)
    );
    assert.deepEqual(missing, []);
    assert.ok(options.includes('stepMs'));
  });

  test('object keys complete for a method and skip keys already used', function (assert) {
    const result = complete('__().lowpass({ frequency: 400, ');
    assert.ok(labels(result).includes('q'));
    assert.notOk(labels(result).includes('frequency'));
  });

  test('values complete for path', function (assert) {
    assert.deepEqual(labels(complete('__().sampler({ path: ')), [
      'this.filepath',
    ]);
  });

  test('selector strings offer ids declared in the script', function (assert) {
    const result = complete(
      '__().sine({ id: "bass", class: "low, loud" })\n__("'
    );
    const options = labels(result);
    assert.ok(options.includes('#bass'));
    assert.ok(options.includes('.low'));
    assert.ok(options.includes('.loud'));
    assert.ok(options.includes('sine'));
  });

  test('selector completion replaces only the current token', function (assert) {
    const doc = '__("sine, .lo';
    assert.strictEqual(complete(doc).from, doc.length - 3);
  });

  test('nothing is offered in comments, or in other strings', function (assert) {
    assert.strictEqual(complete('// __().'), null);
    assert.strictEqual(complete('const x = "__().'), null);
  });
});
