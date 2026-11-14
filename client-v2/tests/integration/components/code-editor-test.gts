import { module, test } from 'qunit';
import { render, rerender, settled } from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';
import { EditorView } from '@codemirror/view';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import CodeEditor from 'client-v2/components/code-editor';

function viewOf(selector: string): EditorView {
  const content = document.querySelector<HTMLElement>(
    `${selector} .cm-content`,
  );
  const view = content ? EditorView.findFromDOM(content) : null;
  if (!view) throw new Error(`No editor in ${selector}`);
  return view;
}

class State {
  @tracked doc = "__().sine(220).gain(0.2).to('main');";
  @tracked shown = true;
  changes: string[] = [];
  onChange = (value: string): void => {
    this.changes.push(value);
    this.doc = value;
  };
}

module('Integration | Component | code-editor', function (hooks) {
  setupRenderingTest(hooks);

  test('it mounts an editor showing the text, with an accessible name', async function (assert) {
    const state = new State();
    await render(
      <template>
        <CodeEditor @doc={{state.doc}} @label="Track 1 script" />
      </template>,
    );

    assert.dom('[data-test-code-editor]').hasAttribute('data-editor-ready');
    assert.dom('[data-test-code-editor] .cm-editor').exists({ count: 1 });
    assert.dom('.cm-content').hasAria('label', 'Track 1 script');
    assert.strictEqual(
      viewOf('[data-test-code-editor]').state.doc.toString(),
      state.doc,
    );
  });

  test('it reports each edit with the whole text', async function (assert) {
    const state = new State();
    await render(
      <template>
        <CodeEditor @doc={{state.doc}} @onChange={{state.onChange}} />
      </template>,
    );

    const view = viewOf('[data-test-code-editor]');
    view.dispatch({
      changes: { from: 0, insert: '// kick\n' },
      userEvent: 'input.type',
    });
    await settled();

    assert.deepEqual(state.changes, [
      "// kick\n__().sine(220).gain(0.2).to('main');",
    ]);
    assert.strictEqual(
      view.state.doc.toString(),
      state.doc,
      'the editor keeps what was typed',
    );
  });

  test('text changed by the host replaces the editor’s, without reporting an edit', async function (assert) {
    const state = new State();
    await render(
      <template>
        <CodeEditor @doc={{state.doc}} @onChange={{state.onChange}} />
      </template>,
    );

    state.doc = "__().saw(110).to('main');";
    await rerender();

    assert.strictEqual(
      viewOf('[data-test-code-editor]').state.doc.toString(),
      "__().saw(110).to('main');",
    );
    assert.deepEqual(state.changes, []);
  });

  test('it removes the editor with the component', async function (assert) {
    const state = new State();
    await render(
      <template>
        {{#if state.shown}}<CodeEditor @doc={{state.doc}} />{{/if}}
      </template>,
    );
    const view = viewOf('[data-test-code-editor]');

    state.shown = false;
    await rerender();

    assert.dom('.cm-editor').doesNotExist();
    assert.notOk(view.dom.isConnected, 'the CodeMirror view is gone');
  });
});
