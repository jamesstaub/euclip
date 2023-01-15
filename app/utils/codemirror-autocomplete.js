import { scopeCompletionSource } from '@codemirror/lang-javascript';
import { syntaxTree } from '@codemirror/language';

import { AudioNodeConfig } from './audio-node-config';

const nodeOptions = Object.keys(AudioNodeConfig);

import { Extension } from '@codemirror/state';
import {
  CompletionContext,
  autocompletion,
  Completion,
} from '@codemirror/autocomplete';

function completionsForParents(parents) {
  switch (parents.firstObject) {
    case '__':
      return utilCompletions;
    case '__()':
      return nodeCompletions;

    default:
      return [];
  }
}

export function objComplete() {
  return autocompletion({
    override: [
      (context) => {
        const { state, pos } = context;
        const line = state.doc.lineAt(pos);
        if (!line) return null;
        const lastChars = line.text;
        const words = lastChars.replace('\t', '').split(' ');
        const activeTyping = words[words.length - 1]; // What the user is currently typing (everything after the last space)
        const activeTypingSubstr = activeTyping.split(/[^\w$]/).lastObject;

        // If the last character typed is a dot then we need to look at member objects of the obj object

        // Used for generic handling between member and non-member objects
        const isMember = activeTyping.charAt(activeTyping.length - 1) === '.';

        // Is a member, get a list of all members, and the prefix
        const parents = activeTyping
          .substring(0, activeTyping.length - 1)
          .split('.');
          let options = completionsForParents(parents);
          let from = context.pos;

        if (!isMember) {
          options = options.filter((completions) =>
            completions.label.startsWith(activeTypingSubstr)
          );
          from = context.pos - activeTypingSubstr.length;
        }
        // CompletionResult
        return {
          from: from,
          filter: true,
          validFor: null,
          options: options,
        };
      },
    ],

    // TODO:
    // parse links like /examples/delay.html
    // and create href to cracked docs
    // addToOptions: {
    //   render(completion) {
    //     console.log(completion);
    //     return completion;
    //   },
    //   position: 20,
    // },
  });
}
export const crackedCompletion = objComplete();

// export default function completeCrackedNode(context) {
//   const tree = syntaxTree(context.state);
// let nodeBefore = tree.resolveInner(context.pos, -1);
// const tokenBefore = context.tokenBefore(types);
//   // let textBefore = context.state.sliceDoc(tokenBefore.from, context.pos);
//   if (tokenBefore) {
//     console.log(tokenBefore);
//     // console.log(context.state.sliceDoc(tokenBefore?.from, tokenBefore?.to));
//     console.log(context.state.sliceDoc(tokenBefore.from, tokenBefore.to));
//   }
//   let matchCrackedObj = true;
//   if (matchCrackedObj) {
//     return
//   }

// console.log('name:', nodeBefore?.name);
// console.log('nextSib', nodeBefore?.nextSibling?.name);
// console.log('parent', nodeBefore?.parent);
// console.log('ctx', tokenBefore, tokenBefore?.type);
// if (
//   nodeBefore.name != 'BlockComment' ||
//   context.state.sliceDoc(nodeBefore.from, nodeBefore.from + 3) != '/**'
// )
//   return null;
// let textBefore = context.state.sliceDoc(nodeBefore.from, context.pos);
// let tagBefore = /@\w*$/.exec(textBefore);
// if (!tagBefore && !context.explicit) return null;
// return {
//   from: tagBefore ? nodeBefore.from + tagBefore.index : context.pos,
//   options: nodeOptions,
//   validFor: /^(@\w*)?$/,
// };
// }

/**
 * TODO: these completions are made from the parse-doc.js script in my fork of i_dropped_my_phone_and_the_screen_cracked repo
 *
 */
const sourceNodeCompletions = [
  {
    label: 'sampler',
    type: 'Miscellaneous',
    detail:
      'Sampler - sound file player\n\n[See more sampler examples](examples/sampler.html)',
    boost: 99, // autocomplete ranking
  },
  {
    label: 'noise',
    type: 'Noise',
    boost: 70,
    detail:
      'noise parametrized noise node\n\n[See more noise examples](examples/noise.html)',
  },
  {
    label: 'pink',
    type: 'Noise',
    boost: 70,
    detail: 'Pink Noise\n\n[See more noise examples](examples/noise.html)',
  },
  {
    label: 'white',
    type: 'Noise',
    boost: 70,
    detail: 'White Noise\n\n[See more noise examples](examples/noise.html)',
  },
  {
    label: 'brown',
    type: 'Noise',
    boost: 70,
    detail: 'Brown Noise\n\n[See more noise examples](examples/noise.html)',
  },
  {
    label: 'sine',
    type: 'Oscillator',
    boost: 90,
    detail:
      'Sine Wave Oscillator\n\n[See more oscillator examples](examples/oscillators.html)',
  },
  {
    label: 'square',
    type: 'Oscillator',
    boost: 90,
    detail:
      'Square Wave Oscillator\n\n[See more oscillator examples](examples/oscillators.html)',
  },
  {
    label: 'saw',
    type: 'Oscillator',
    boost: 90,
    detail:
      'Sawtooth Wave Oscillator\n\n[See more oscillator examples](examples/oscillators.html)',
  },
  {
    label: 'triangle',
    type: 'Oscillator',
    boost: 90,
    detail:
      'Triangle Wave Oscillator\n\n[See more oscillator examples](examples/oscillators.html)',
  },
];

const nodeCompletions = [
  ...sourceNodeCompletions,
  {
    label: 'script',
    type: 'Node',
    detail: 'Native Script node',
    boost: 0,
  },
  {
    label: 'waveshaper',
    type: 'Node',
    detail: 'Native Waveshaper',
    boost: 0,
  },
  {
    label: 'compressor',
    type: 'Node',
    detail: 'Native Compressor',
    boost: 0,
  },
  {
    label: 'gain',
    type: 'Node',
    detail: 'Native Gain',
    boost: 0,
  },
  {
    label: 'native_delay',
    type: 'Node',
    detail:
      'Naming this with prefix native so I can use "delay" as a plugin name\nmax buffer size three minutes',
  },
  {
    label: 'osc',
    type: 'Node',
    detail: 'Native oscillator, used the oscillator plugins',
    boost: 0,
  },
  {
    label: 'biquadFilter',
    type: 'Node',
    detail: 'Native biquad filter, used by filter plugins',
    boost: 0,
  },
  {
    label: 'channelMerger',
    type: 'Node',
    detail: 'Native channelMerger',
    boost: 0,
  },
  {
    label: 'channelSplitter',
    type: 'Node',
    detail: 'Native channelSplitter',
    boost: 0,
  },
  {
    label: 'convolver',
    type: 'Node',
    detail: 'Native convolver, used by reverb',
    boost: 0,
  },
  {
    label: 'stereoPanner',
    type: 'Node',
    detail: 'Native stereo panner, used by panner',
    boost: 0,
  },
  {
    label: 'destination',
    type: 'Node',
    detail: 'Native destination, used by the dac plugin',
    boost: 0,
  },
  {
    label: 'origin',
    type: 'Node',
    detail:
      'Native sound input node, used by the adc plugin\norigin = opposite of destination',
  },
  {
    label: 'reverb',
    type: 'Delay',
    detail:
      'Convolver Reverb\n\n[See more reverb examples](examples/delay.html)',
  },
  {
    label: 'delay',
    type: 'Delay',
    detail: 'Delay\n\n[See more delay examples](examples/delay.html)',
  },
  {
    label: 'comb',
    type: 'Delay',
    detail: 'Comb\n\n[See more reverb examples](examples/delay.html)',
  },
  {
    label: 'bitcrusher',
    type: 'Distortion',
    boost: 85,
    detail:
      'Bitcrusher\n\n[See more bitcrusher examples](examples/distortion.html)',
  },
  {
    label: 'ring',
    type: 'Distortion',
    boost: 85,
    detail:
      'Ring Modulator\n\n[See more ring modulator examples](examples/distortion.html)',
  },
  {
    label: 'overdrive',
    type: 'Distortion',
    boost: 85,
    detail:
      'Overdrive, waveshaper with additional parameters\n\n[See more overdrive examples](examples/distortion.html)',
  },
  {
    label: 'lowpass',
    type: 'Filter',
    boost: 80,
    detail:
      'Lowpass Filter\n\n[See more lowpass examples](examples/filters.html)',
  },
  {
    label: 'highpass',
    type: 'Filter',
    boost: 80,
    detail:
      'Highpass Filter\n\n[See more highpass examples](examples/filters.html)',
  },
  {
    label: 'bandpass',
    type: 'Filter',
    boost: 80,
    detail:
      'Bandpass Filter\n\n[See more bandpass examples](examples/filters.html)',
  },
  {
    label: 'lowshelf',
    type: 'Filter',
    boost: 80,
    detail:
      'Lowshelf Filter\n\n[See more lowshelf examples](examples/filters.html)',
  },
  {
    label: 'highshelf',
    type: 'Filter',
    boost: 80,
    detail:
      'Highshelf Filter\n\n[See more highshelf examples](examples/filters.html)',
  },
  {
    label: 'peaking',
    type: 'Filter',
    boost: 80,
    detail:
      'Peaking Filter\n\n[See more peaking examples](examples/filters.html)',
  },
  {
    label: 'notch',
    type: 'Filter',
    boost: 80,
    detail: 'Notch Filter\n\n[See more notch examples](examples/filters.html)',
  },
  {
    label: 'allpass',
    type: 'Filter',
    boost: 80,
    detail:
      'Allpass Filter\n\n[See more allpass examples](examples/filters.html)',
  },
  {
    label: 'clip',
    type: 'Miscellaneous',
    detail: 'Clips audio level at 1/-1',
  },
  {
    label: 'dac',
    type: 'Miscellaneous',
    detail:
      'System out - destination with a master volume. Output is clipped if gain is 1 or less.',
  },
  {
    label: 'adc',
    type: 'Miscellaneous',
    detail: 'System in - input with a master volume',
  },
  {
    label: 'out',
    type: 'Miscellaneous',
    detail: 'System out - destination with a master volume\nAlias for dac',
  },
  {
    label: 'multi_out',
    type: 'Miscellaneous',
    detail:
      'System multi_out - destination with a master volume w/ multi-channel support',
  },
  {
    label: 'in',
    type: 'Miscellaneous',
    detail: 'System in - input with a master volume\nAlias for adc',
  },
  {
    label: 'panner',
    type: 'Miscellaneous',
    detail: 'Panner - simple stereo panner',
  },
  {
    label: 'gang_of_oscillators',
    type: 'Synth',
    detail:
      'gang_of_oscillators\n\nJust a bunch of oscillators\n\n[See more synth examples](examples/synth.html)',
  },
  {
    label: 'monosynth',
    type: 'Synth',
    detail:
      'monosynth\n\nSimple monophonic synth\n\n[See more synth examples](examples/synth.html)',
  },
  {
    label: 'polysynth',
    type: 'Synth',
    detail:
      'polysynth\n\nSimple polyphonic synth\n\n[See more synth examples](examples/synth.html)',
  },
];

const utilCompletions = [
  {
    label: 'reset',
    type: 'Find',
    detail:
      'resets everything to its initial state\n<pre><code>//reset state for the entire app\ncracked.reset();</code></pre>',
  },
  {
    label: 'exec',
    type: 'Find',
    detail:
      'executes a method with a specific set of selected nodes without modifying the internal selectedNodes array\n<pre><code>//filter everything but the sines from currently selected nodes and\n//execute the frequency method against the remaining sines.\n//the internal _selectedNodes array remains unchanged\ncracked.exec(\n"frequency",\n200,\ncracked.filter("sine")\n);</code></pre>',
  },
  {
    label: 'each',
    type: 'Find',
    detail:
      'iterate over the selectedNodes array, executing the supplied function for each element\n<pre><code>__.each(type, function(node,index,array){\n//Loops over any selected nodes. Parameters are the\n//current node, current index, and the selectedNode array\n});</code></pre>',
  },
  {
    label: 'filter',
    type: 'Find',
    detail:
      'Filter selected nodes with an additional selector returns node array that can used with exec()\n<pre><code>//select any sine & sawtooth oscillators\n__("sine,saw");\n\n//filter out everything but the sines and\n//execute the frequency method against those nodes.\n//the internal _selectedNodes array remains unchanged\ncracked.exec(\n"frequency",\n200,\ncracked.filter("sine")\n);</code></pre>',
  },
  {
    label: 'find',
    type: 'Find',
    detail:
      'Find nodes with a selector returns node array that can used with exec()\n<pre><code>//find all the sines in the patch and\n//execute the frequency method against those nodes.\n//the internal _selectedNodes array remains unchanged\ncracked.exec(\n"frequency",\n200,\ncracked.find("sine")\n);</code></pre>',
  },
  {
    label: 'start',
    type: 'Control',
    detail:
      'Calls start() on the currently selected nodes. Throws no error if there aren\'t any selected nodes with a start method\n<pre><code>//create and connect sine->lowpass->dac\n__().sine().lowpass().dac();\n//start the sine node\n__("sine").start();</code></pre>\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'stop',
    type: 'Control',
    detail:
      'Calls stop() on the currently selected nodes. Throws no error if there are no selected nodes that have a stop method.\n<pre><code>//create and connect sine->lowpass->dac\n__().sine().lowpass().dac();\n//stop the sine node\n__("sine").stop();</code></pre>\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'ramp',
    type: 'Control',
    detail:
      'Public method to ramp a parameter on currently selected nodes. Target & timeToRamp parameters can be numbers or arrays of numbers for multisegement ramps. Initial value param is optional, if omitted, then the current value is used as the initial value. If loop is running, then ramp start times are snapped to the sequencer grid.\n<pre><code>//create and connect sine->lowpass->dac & play\n__().sine().lowpass().dac().play();\n//ramp the frequency of the sine. 220 to 880 in 5 seconds\n__("sine").ramp(880,5,"frequency",220);</code></pre>\n\n[See more envelope examples](examples/envelopes.html)',
  },
  {
    label: 'attr',
    type: 'Control',
    detail:
      'Set or get attribute values on a node. Takes an object with\nany number of key:value pairs to set. A string with the param\nname returns the current value of that param on the first selected\nnode.\n\n<pre><code>//create and connect sine->lowpass->dac & play\n__().sine().lowpass().dac().play();\n//set the frequency of the sine to 880\n__("sine").attr({"frequency":880});\n\n//get the frequency\n__("sine").attr("frequency"); //880</code></pre>\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'loop',
    type: 'Sequence',
    detail:
      'main method for loop\n\n<pre><code>//configure the loop: 8 steps, 100ms between steps\n__.loop({steps:8,interval:100});\n\n//start\n__.loop("start");\n//stop\n__.loop("stop");\n//reset the loop params\n__.loop("reset");</code></pre>\n\n[See sequencing examples](examples/sequencing.html)',
  },
  {
    label: 'bind',
    type: 'Sequence',
    detail:
      'Listener - binds a set of audio nodes and a callback to loop step events',
  },
  {
    label: 'unbind',
    type: 'Sequence',
    detail: 'Remove any steps listeners registered on these nodes',
  },
  {
    label: 'begin',
    type: 'Macro',
    detail:
      'start macro recording, add any user parameters (id,classname,etc) to the container macro\n<pre><code>//define a simple macro named "microsynth"\n__().begin("microsynth").sine().gain(0).dac().end("microsynth");</code></pre>',
  },
  {
    label: 'end',
    type: 'Macro',
    detail:
      'end macro recording\n<pre><code>//define a simple macro named "microsynth"\n__().begin("microsynth").sine().gain(0).dac().end("microsynth");</code></pre>',
  },
  {
    label: 'midi_supported',
    type: 'Midi',
    boost: 40,
    detail:
      'Is midi supported?\n<pre><code>if(__.midi_supported()) {\n//do midi stuff here\n//cuz you can\n}</code></pre>',
  },
  {
    label: 'midi_init',
    type: 'Midi',
    boost: 40,
    detail:
      'Initialize midi. Callback is invoked when ready.\n<pre><code>//when midi is ready...\n__.midi_init(function(){\n//...call this function\n});</code></pre>',
  },
  {
    label: 'midi_receive',
    type: 'Midi',
    boost: 40,
    detail:
      'Midi input. Bind handler for the onMIDIMessage event.\n<pre><code>//when midi is ready...\n__.midi_init(function(){\n__.midi_receive(function(midiEvent){\n//handle incoming raw midi events here...\n});\n});</code></pre>',
  },
  {
    label: 'midi_noteon',
    type: 'Midi',
    boost: 40,
    detail:
      'Midi input. Shorthand binding for note ons\n<pre><code>//when midi is ready...\n__.midi_init(function(){\n//get midi noteon events\n__.midi_noteon(function(noteData){\n//note data = [status,pitch,velocity]\n//handle midi note ons...\n});\n});</code></pre>',
  },
  {
    label: 'midi_noteoff',
    type: 'Midi',
    boost: 40,
    detail:
      'Midi input. Shorthand binding for note offs\n<pre><code>//when midi is ready...\n__.midi_init(function(){\n//get midi noteoff events\n__.midi_noteoff(function(noteData){\n//note data = [status,pitch,velocity]\n//handle midi note offs...\n});\n});</code></pre>',
  },
  {
    label: 'midi_control',
    type: 'Midi',
    boost: 40,
    detail:
      'Midi input. Shorthand binding for midi control messages\n<pre><code>//when midi is ready...\n__.midi_init(function(){\n//get midi control events\n__.midi_control(function(noteData){\n//note data = [status,pitch,velocity]\n//handle midi control events...\n});\n});</code></pre>',
  },
  {
    label: 'connect',
    type: 'Connect',
    detail:
      'chainable method to connect nodes to previously instantiated nodes. Takes a selector to find the nodes to connect to.\n<pre><code>//create and connect sine->lowpass->dac\n__().sine().lowpass().dac();\n//create a sawtooth and connect to the lowpass instantiated above\n__().saw().connect("lowpass");</code></pre>',
  },
  {
    label: 'remove',
    type: 'Connect',
    detail:
      'chainable method to stop, disconnect and remove the currently selected nodes. Takes a time in ms to schedule the node removal.\n<pre><code>//create and connect sine->lowpass->dac\n__().sine().lowpass().dac();\n//remove the lowpass instantiated above in 100ms\n__("lowpass").remove(100);</code></pre>',
  },
  {
    label: 'log',
    type: 'Debug',
    detail:
      'log selected nodes to console if any.\n<pre><code>//create and connect sine -> lowpass -> dac\n__().sine().lowpass().dac();\n\n//logs the [oscillatorNode] object to the console\n__("sine").log()</code></pre>',
  },
  {
    label: 'size',
    type: 'Debug',
    detail:
      'return the length of selected nodes array\n<pre><code>//create and connect sine -> lowpass -> dac\n__().sine().lowpass().dac();\n\n//returns 2\n__("sine,lowpass").size();</code></pre>',
  },
  {
    label: '_dumpState',
    type: 'Debug',
    detail: 'dump the node lookup object to the console\nworks in debug only',
  },
  {
    label: '_getNode',
    type: 'Debug',
    detail: 'debug method to get a node with a uuid\nworks in debug only',
  },
  {
    label: '_getNodeLookup',
    type: 'Debug',
    detail: 'debug method to get all nodes',
  },
  {
    label: '_setNodeLookup',
    type: 'Debug',
    detail:
      'debug method to set node UUIDs for a selector in the nodeLookup object.',
  },
  {
    label: 'ifUndef',
    type: 'Type',
    detail: 'Returns the 2nd argument if the 1st is undefined',
  },
  {
    label: 'isNotUndef',
    type: 'Type',
    detail: 'Returns true if not undefined',
  },
  {
    label: 'isUndef',
    type: 'Type',
    detail: 'Returns true if undefined',
  },
  {
    label: 'isObj',
    type: 'Type',
    detail: 'Returns true if param is an object',
  },
  {
    label: 'isNum',
    type: 'Type',
    detail: 'Returns true if param is a number',
  },
  {
    label: 'isStr',
    type: 'Type',
    detail: 'Returns true if param is a string',
  },
  {
    label: 'isArr',
    type: 'Type',
    detail: 'Returns true if param is an array',
  },
  {
    label: 'isFun',
    type: 'Type',
    detail: 'Returns true if param is a function',
  },
  {
    label: 'random_interval',
    type: 'Algorithmic',
    boost: 50,
    detail: 'execute a callback at random intervals within a range',
  },
  {
    label: 'random_envelope',
    type: 'Algorithmic',
    boost: 50,
    detail: 'create a adsr envelope with random values scaled to a length',
  },
  {
    label: 'fill_array',
    type: 'Algorithmic',
    boost: 50,
    detail: 'fill an array with some values',
  },
  {
    label: 'array_next',
    type: 'Algorithmic',
    boost: 50,
    detail:
      'advance thru array one step at a time.\nstart over when arriving at the end',
  },
  {
    label: 'chance',
    type: 'Algorithmic',
    boost: 50,
    detail: 'Returns a boolean based on percentage.',
  },
  {
    label: 'scales',
    type: 'Algorithmic',
    boost: 50,
    detail: 'Returns a musical scale/mode based on type',
  },
  {
    label: 'chords',
    type: 'Algorithmic',
    boost: 50,
    detail: 'Returns a musical scale/mode based on type',
  },
  {
    label: 'random_scale',
    type: 'Algorithmic',
    boost: 50,
    detail:
      'Return a random series of frequencies from randomly selected octaves from a given scale',
  },
  {
    label: 'random_arpeggio',
    type: 'Algorithmic',
    boost: 50,
    detail:
      'Return a random series of frequencies from a randomly selected octave from a given chord',
  },
  {
    label: 'shuffle',
    type: 'Algorithmic',
    boost: 50,
    detail: 'Takes a reference to an array, shuffles it\nand returns it',
  },
  {
    label: 'random',
    type: 'Algorithmic',
    boost: 50,
    detail: 'Returns a random number between min & max',
  },
  {
    label: 'throttle_factory',
    type: 'Algorithmic',
    boost: 50,
    detail:
      'Factory to create a throttling function that returns true when called every nth times',
  },
  {
    label: 'sequence_factory',
    type: 'Algorithmic',
    boost: 50,
    detail:
      'Factory to create a sequencing function that returns true when called every nth times',
  },
  {
    label: 'sequence',
    type: 'Algorithmic',
    boost: 50,
    detail:
      'Sequence - create a series of steps that take a function to execute and a time in minutes for when to execute it\n\n[See more sampler examples](examples/sequence.html)',
  },
  {
    label: 'adsr',
    type: 'Envelope',
    detail:
      "Attack Decay Sustain Release envelope\n\n[See more adsr examples](examples/envelopes.html)\n\nAttack time is the time taken for initial run-up of level from nil to peak, beginning when the key is first pressed.\nDecay time is the time taken for the subsequent run down from the attack level to the designated sustain level.\nSustain level is the level during the main sequence of the sound's duration, until the key is released.\nRelease time is the time taken for the level to decay from the sustain level to zero after the key is released.",
  },
  {
    label: 'mouse_movement',
    type: 'Interaction',
    detail:
      'Passes mouse move events to a callback. Tracks the movement of the mouse.\nweb audio',
  },
  {
    label: 'key_press',
    type: 'Interaction',
    detail:
      'Passes key press events to a callback. Tracks keyboard activity.\nweb audio',
  },
  {
    label: 'lfo',
    type: 'Modulator',
    detail:
      'Low Frequency Oscillator\n\n[See more LFO examples](examples/modulation.html)',
  },
  {
    label: 'stepper',
    type: 'Modulator',
    detail: 'Stepper\n\nfill an audio buffer with a series of discrete values.',
  },
  {
    label: 'frequency',
    type: 'Setters',
    detail:
      '[See more control examples](examples/control.html)\n\nFrequency setter convenience method',
  },
  {
    label: 'detune',
    type: 'Setters',
    detail:
      'Detune setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'type',
    type: 'Setters',
    detail:
      'Type setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'volume',
    type: 'Setters',
    detail:
      'Gain setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'fadeOut',
    type: 'Setters',
    detail:
      'Fade out convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'fadeIn',
    type: 'Setters',
    detail:
      'Fade in convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'time',
    type: 'Setters',
    detail:
      'Delay time setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'feedback',
    type: 'Setters',
    detail:
      'Feedback setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'speed',
    type: 'Setters',
    detail:
      'Speed setter convenience method\n\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'drive',
    type: 'Setters',
    detail:
      'Drive setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'distortion',
    type: 'Setters',
    detail:
      'Distortion setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'q',
    type: 'Setters',
    detail:
      'q setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'pan',
    type: 'Setters',
    detail:
      'pan setter convenience method\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'play',
    type: 'Utility',
    boost: 40,
    detail:
      'Convenient way to say start everything\n\n[See more control examples](examples/control.html)',
  },
  {
    label: 'scale',
    type: 'Utility',
    boost: 40,
    detail:
      'Scale an input number between min & max to an output number between a min & max. Supports logarithmic or linear scaling.',
  },
  {
    label: 'sec2ms',
    type: 'Utility',
    boost: 40,
    detail: 'Converts a second value to millisecond value',
  },
  {
    label: 'ms2sec',
    type: 'Utility',
    boost: 40,
    detail: 'Converts a millisecond value to second value',
  },
  {
    label: 'ms2min',
    type: 'Utility',
    boost: 40,
    detail: 'Converts a millisecond value to minute value',
  },
  {
    label: 'min2ms',
    type: 'Utility',
    boost: 40,
    detail: 'Converts a minute value to a millisecond value',
  },
  {
    label: 'isSupported',
    type: 'Utility',
    boost: 40,
    detail: 'Returns a boolean true if the browser supports\nweb audio',
  },
  {
    label: 'pitch2freq',
    type: 'Utility',
    boost: 40,
    detail: 'Converts a pitch value to frequency',
  },
  {
    label: 'freq2pitch',
    type: 'Utility',
    boost: 40,
    detail: 'Converts a frequency to a pitch value',
  },
];
