import Modifier from 'ember-modifier';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from '../utils/codemirror-setup';
import { materialDark } from '../utils/codemirror-theme';

export default class CodemirrorModifier extends Modifier {
  didSetup = false;

  _editor;
  _id;

  modify(element, [id, editorContent, onUpdate]) {
    if (!this.didSetup) {
      this.didSetup = true;
      this._editor = this.setupEditor(element, editorContent, onUpdate);
    }

    if (id != this._id) {
      this.update(editorContent);
    }

    this._id = id;
  }

  setupEditor(element, doc, onUpdate) {
    const updateListener = EditorView.updateListener.of((viewUpdate) => {
      if (viewUpdate.docChanged) {
        onUpdate(viewUpdate.state.doc.toString());
      }
    });
    const state = EditorState.create({
      doc,
      extensions: [
        basicSetup,
        javascript(),
        materialDark,
        updateListener,
      ],
    });
    const view = new EditorView({
      state,
    });

    element.append(view.dom);
    return view;
  }

  update(content) {
    this._editor.dispatch(
      this._editor.state.update({
        changes: {
          from: 0,
          to: this._editor.state.doc.length,
          insert: content,
        },
      })
    );
  }
}
