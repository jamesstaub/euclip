import Component from '@glimmer/component';
import { action } from '@ember/object';
import { noiseNodes, synthNodes } from '../utils/cracked';
import {
  AudioNodeConfig,
  DISTORTION,
  DYNAMICS,
  FILTER,
  TIME,
} from '../utils/audio-node-config';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

// This component creates a UI for generating scripts by configuring a series of audio nodes
export default class SignalChainCreatorComponent extends Component {
  @tracked selectedNodes;
  @tracked selectedSourceNode;
  @tracked effectsDefinition; //
  @tracked activeNodeIdx;

  selectedNodes = A([]);
  selectedEffects = A([]);

  signalChainPresets = [
    { label: 'Sampler', data: ['sampler', 'gain', 'channelStrip'] },
    { label: 'Synth', data: ['triangle', 'adsr', 'lowpass', 'channelStrip'] },
  ];

  constructor() {
    super(...arguments);

    // user created signal chain of nodes that will be displayed visually and
    // used to generate a cracked sript

    this.sourceGroups = [
      {
        type: 'sound file',
        nodes: ['sampler'],
      },
      {
        type: 'oscillators',
        nodes: synthNodes,
      },
      {
        type: 'noise',
        nodes: noiseNodes,
      },
    ];

    this.effectsGroups = [DYNAMICS, DISTORTION, TIME, FILTER].map((type) => {
      return {
        nodes: Object.keys(AudioNodeConfig).filter(
          (key) => AudioNodeConfig[key].type === type
        ),
        type,
      };
    });

    this.activeNodeIdx = 0;
  }

  setEffectsDefinition() {
    this.effectsDefinition = this.selectedEffects
      .map((effectNode) => {
        // convert to cracked script
        return `  .${effectNode}()`;
      })
      .join('\n');
  }

  get generatedScript() {
    let sourceNodeParams = `id: this.id,
    path: this.filepath
`;

    return `__()
  .${this.selectedSourceNode}({
    ${sourceNodeParams}
  })
${this.effectsDefinition}
  .channelStrip()
  .connect('#main-output')
`;
  }

  computeNodesArray() {
    this.selectedNodes.clear();
    this.selectedNodes.pushObject(this.selectedSourceNode);
    this.selectedNodes.pushObjects(this.selectedEffects);
    this.setEffectsDefinition();
    this.args.onGenerateScript(this.generatedScript);
  }

  @action
  selectPreset(presetData) {
    let data = [...presetData];
    this.selectedSourceNode = data.shift();
    this.selectedEffects = data;
    this.computeNodesArray();
  }

  @action
  addSourceNodeToSignalChain(node) {
    this.selectedSourceNode = node;
    this.computeNodesArray();
    this.activeNodeIdx = null;
  }

  @action
  insertEffectNodeAtIdx(idx, node) {
    if (idx > this.selectedEffects.length - 1) {
      this.selectedEffects.pushObject(node);
    } else {
      // this.selectedNodes.insertAt(idx, node);
      this.selectedEffects.removeAt(idx - 1);
      this.selectedEffects.insertAt(idx - 1, node);
    }
    this.computeNodesArray();
    this.activeNodeIdx = null;
  }

  @action
  removeNodeFromArray(idx) {
    this.selectedNodes.removeAt(idx);
    this.selectedEffects.removeAt(idx - 1);
    this.computeNodesArray();
  }

  // open the menu on one node at a time
  @action
  setActiveNode(idx) {
    if (this.activeNodeIdx === idx) {
      this.activeNodeIdx = null;
    } else {
      this.activeNodeIdx = idx;
    }
  }

  @action
  deselectActiveNode({ target }) {
    // only catch clicks on the background div
    if (target.tagName === 'BUTTON') {
      return;
    }
    this.activeNodeIdx = null;
  }

  @action
  clear() {
    this.selectedSourceNode = null;
    this.selectedNodes = A([]);
    this.selectedEffects = A([]);
  }
}

// WIP attempt at reading audio graph to build UI
//   const connectedNodes = [];
//   // this.trackNodes are ember-data models
//   this.args.trackNodes.map((nodeModel) => {
//     // audioNode is the actual webaudio object
//     const audioNode = __._getNode(nodeModel.nodeUUID);
//     connectedNodes.unshift(audioNode);

//     let prevNode = audioNode.getPrevNode();
//     while (prevNode) {
//       connectedNodes.unshift(prevNode);
//       prevNode = prevNode?.getPrevNode();
//     }
//   });
//   return connectedNodes
// }
