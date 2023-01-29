/**
 * Parsed JSDocs from cracked repo parse-doc.js
 * method and object name completions on the global cracked object
 */
export const objectCompletions = [
  {
    label: '',
    type: 'Find',
    detail:
      'Updates the internal selected nodes array with a collection of audio nodes matching the selector provided. Type, Class & Id selectors are supported.\n' +
      '<pre>\n' +
      '<code>//type selector using the node name, sets the frequency for all sines\n' +
      '__("sine").frequency(200);\n' +
      '\n' +
      '//set the frequency for the node with id "foo"\n' +
      '__("#foo").frequency(200);\n' +
      '\n' +
      '//set the frequency for any nodes with a class of "bar"\n' +
      '__(".bar").frequency(200);\n' +
      '\n' +
      '//select all sines, any nodes with classname "bar" or id of "foo"\n' +
      '//and set their frequencies to 200\n' +
      '__("sine,.bar,#foo").frequency(200);</code></pre>\n' +
      '\n' +
      '[See more selector examples](examples/selector.html)\n' +
      '\n' +
      'If invoked without arguments, cracked() resets the selection/connection state, removing any record of previous nodes and effectively marking the start of a new connection chain. Since a new node will try to connect to any previous node, calling __() tells a node that there is no previous node to connect to.\n' +
      'For example:\n' +
      '<pre>\n' +
      '<code>//Create & connect sine -> lowpass -> dac\n' +
      '__().sine();\n' +
      '__.lowpass();\n' +
      '__.dac();\n' +
      '\n' +
      "//Create but don't connect\n" +
      '__().sine();\n' +
      '__().lowpass();\n' +
      '__().dac();</code></pre>\n' +
      '\n' +
      'cracked is also the namespace for public methods and also can be written as a\n' +
      'double underscore __\n' +
      '<pre>\n' +
      '<code>__("sine"); //same as cracked("sine")</code>\n' +
      '</pre>',
    boost: -10,
  },
  {
    label: 'reset',
    type: 'Find',
    detail:
      'resets everything to its initial state\n' +
      '<pre><code>//reset state for the entire app\n' +
      'cracked.reset();</code></pre>',
    boost: -10,
  },
  {
    label: 'exec',
    type: 'Find',
    detail:
      'executes a method with a specific set of selected nodes without modifying the internal selectedNodes array\n' +
      '<pre><code>//filter everything but the sines from currently selected nodes and\n' +
      '//execute the frequency method against the remaining sines.\n' +
      '//the internal _selectedNodes array remains unchanged\n' +
      'cracked.exec(\n' +
      '"frequency",\n' +
      '200,\n' +
      'cracked.filter("sine")\n' +
      ');</code></pre>',
    boost: -10,
  },
  {
    label: 'each',
    type: 'Find',
    detail:
      'iterate over the selectedNodes array, executing the supplied function for each element\n' +
      '<pre><code>__.each(type, function(node,index,array){\n' +
      '//Loops over any selected nodes. Parameters are the\n' +
      '//current node, current index, and the selectedNode array\n' +
      '});</code></pre>',
    boost: -10,
  },
  {
    label: 'filter',
    type: 'Find',
    detail:
      'Filter selected nodes with an additional selector returns node array that can used with exec()\n' +
      '<pre><code>//select any sine & sawtooth oscillators\n' +
      '__("sine,saw");\n' +
      '\n' +
      '//filter out everything but the sines and\n' +
      '//execute the frequency method against those nodes.\n' +
      '//the internal _selectedNodes array remains unchanged\n' +
      'cracked.exec(\n' +
      '"frequency",\n' +
      '200,\n' +
      'cracked.filter("sine")\n' +
      ');</code></pre>',
    boost: -10,
  },
  {
    label: 'find',
    type: 'Find',
    detail:
      'Find nodes with a selector returns node array that can used with exec()\n' +
      '<pre><code>//find all the sines in the patch and\n' +
      '//execute the frequency method against those nodes.\n' +
      '//the internal _selectedNodes array remains unchanged\n' +
      'cracked.exec(\n' +
      '"frequency",\n' +
      '200,\n' +
      'cracked.find("sine")\n' +
      ');</code></pre>',
    boost: -10,
  },
  {
    label: 'start',
    type: 'Control',
    detail:
      "Calls start() on the currently selected nodes. Throws no error if there aren't any selected nodes with a start method\n" +
      '<pre><code>//create and connect sine->lowpass->dac\n' +
      '__().sine().lowpass().dac();\n' +
      '//start the sine node\n' +
      '__("sine").start();</code></pre>\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'stop',
    type: 'Control',
    detail:
      'Calls stop() on the currently selected nodes. Throws no error if there are no selected nodes that have a stop method.\n' +
      '<pre><code>//create and connect sine->lowpass->dac\n' +
      '__().sine().lowpass().dac();\n' +
      '//stop the sine node\n' +
      '__("sine").stop();</code></pre>\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'ramp',
    type: 'Control',
    detail:
      'Public method to ramp a parameter on currently selected nodes. Target & timeToRamp parameters can be numbers or arrays of numbers for multisegement ramps. Initial value param is optional, if omitted, then the current value is used as the initial value. If loop is running, then ramp start times are snapped to the sequencer grid.\n' +
      '<pre><code>//create and connect sine->lowpass->dac & play\n' +
      '__().sine().lowpass().dac().play();\n' +
      '//ramp the frequency of the sine. 220 to 880 in 5 seconds\n' +
      '__("sine").ramp(880,5,"frequency",220);</code></pre>\n' +
      '\n' +
      '[See more envelope examples](examples/envelopes.html)',
    boost: 0,
  },
  {
    label: 'attr',
    type: 'Control',
    detail:
      'Set or get attribute values on a node. Takes an object with\n' +
      'any number of key:value pairs to set. A string with the param\n' +
      'name returns the current value of that param on the first selected\n' +
      'node.\n' +
      '\n' +
      '<pre><code>//create and connect sine->lowpass->dac & play\n' +
      '__().sine().lowpass().dac().play();\n' +
      '//set the frequency of the sine to 880\n' +
      '__("sine").attr({"frequency":880});\n' +
      '\n' +
      '//get the frequency\n' +
      '__("sine").attr("frequency"); //880</code></pre>\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'script',
    type: 'Node',
    detail: 'Native Script node',
    boost: 20,
  },
  {
    label: 'waveshaper',
    type: 'Node',
    detail: 'Native Waveshaper',
    boost: 20,
  },
  {
    label: 'compressor',
    type: 'Node',
    detail: 'Native Compressor',
    boost: 20,
  },
  { label: 'gain', type: 'Node', detail: 'Native Gain', boost: 20 },
  {
    label: 'native_delay',
    type: 'Node',
    detail:
      'Naming this with prefix native so I can use "delay" as a plugin name\n' +
      'max buffer size three minutes',
    boost: 20,
  },
  {
    label: 'osc',
    type: 'Node',
    detail: 'Native oscillator, used the oscillator plugins',
    boost: 20,
  },
  {
    label: 'biquadFilter',
    type: 'Node',
    detail: 'Native biquad filter, used by filter plugins',
    boost: 20,
  },
  {
    label: 'channelMerger',
    type: 'Node',
    detail: 'Native channelMerger',
    boost: 20,
  },
  {
    label: 'channelSplitter',
    type: 'Node',
    detail: 'Native channelSplitter',
    boost: 20,
  },
  {
    label: 'convolver',
    type: 'Node',
    detail: 'Native convolver, used by reverb',
    boost: 20,
  },
  {
    label: 'stereoPanner',
    type: 'Node',
    detail: 'Native stereo panner, used by panner',
    boost: 20,
  },
  {
    label: 'destination',
    type: 'Node',
    detail: 'Native destination, used by the dac plugin',
    boost: 20,
  },
  {
    label: 'origin',
    type: 'Node',
    detail:
      'Native sound input node, used by the adc plugin\n' +
      'origin = opposite of destination',
    boost: 20,
  },
  {
    label: 'loop',
    type: 'Sequence',
    detail:
      'main method for loop\n' +
      '\n' +
      '<pre><code>//configure the loop: 8 steps, 100ms between steps\n' +
      '__.loop({steps:8,interval:100});\n' +
      '\n' +
      '//start\n' +
      '__.loop("start");\n' +
      '//stop\n' +
      '__.loop("stop");\n' +
      '//reset the loop params\n' +
      '__.loop("reset");</code></pre>\n' +
      '\n' +
      '[See sequencing examples](examples/sequencing.html)',
    boost: 0,
  },
  {
    label: 'bind',
    type: 'Sequence',
    detail:
      'Listener - binds a set of audio nodes and a callback to loop step events',
    boost: 0,
  },
  {
    label: 'unbind',
    type: 'Sequence',
    detail: 'Remove any steps listeners registered on these nodes',
    boost: 0,
  },
  {
    label: 'begin',
    type: 'Macro',
    detail:
      'start macro recording, add any user parameters (id,classname,etc) to the container macro\n' +
      '<pre><code>//define a simple macro named "microsynth"\n' +
      '__().begin("microsynth").sine().gain(0).dac().end("microsynth");</code></pre>',
    boost: 0,
  },
  {
    label: 'end',
    type: 'Macro',
    detail:
      'end macro recording\n' +
      '<pre><code>//define a simple macro named "microsynth"\n' +
      '__().begin("microsynth").sine().gain(0).dac().end("microsynth");</code></pre>',
    boost: 0,
  },
  {
    label: 'midi_supported',
    type: 'Midi',
    detail:
      'Is midi supported?\n' +
      '<pre><code>if(__.midi_supported()) {\n' +
      '//do midi stuff here\n' +
      '//cuz you can\n' +
      '}</code></pre>',
    boost: 30,
  },
  {
    label: 'midi_init',
    type: 'Midi',
    detail:
      'Initialize midi. Callback is invoked when ready.\n' +
      '<pre><code>//when midi is ready...\n' +
      '__.midi_init(function(){\n' +
      '//...call this function\n' +
      '});</code></pre>',
    boost: 30,
  },
  {
    label: 'midi_receive',
    type: 'Midi',
    detail:
      'Midi input. Bind handler for the onMIDIMessage event.\n' +
      '<pre><code>//when midi is ready...\n' +
      '__.midi_init(function(){\n' +
      '__.midi_receive(function(midiEvent){\n' +
      '//handle incoming raw midi events here...\n' +
      '});\n' +
      '});</code></pre>',
    boost: 30,
  },
  {
    label: 'midi_noteon',
    type: 'Midi',
    detail:
      'Midi input. Shorthand binding for note ons\n' +
      '<pre><code>//when midi is ready...\n' +
      '__.midi_init(function(){\n' +
      '//get midi noteon events\n' +
      '__.midi_noteon(function(noteData){\n' +
      '//note data = [status,pitch,velocity]\n' +
      '//handle midi note ons...\n' +
      '});\n' +
      '});</code></pre>',
    boost: 30,
  },
  {
    label: 'midi_noteoff',
    type: 'Midi',
    detail:
      'Midi input. Shorthand binding for note offs\n' +
      '<pre><code>//when midi is ready...\n' +
      '__.midi_init(function(){\n' +
      '//get midi noteoff events\n' +
      '__.midi_noteoff(function(noteData){\n' +
      '//note data = [status,pitch,velocity]\n' +
      '//handle midi note offs...\n' +
      '});\n' +
      '});</code></pre>',
    boost: 30,
  },
  {
    label: 'midi_control',
    type: 'Midi',
    detail:
      'Midi input. Shorthand binding for midi control messages\n' +
      '<pre><code>//when midi is ready...\n' +
      '__.midi_init(function(){\n' +
      '//get midi control events\n' +
      '__.midi_control(function(noteData){\n' +
      '//note data = [status,pitch,velocity]\n' +
      '//handle midi control events...\n' +
      '});\n' +
      '});</code></pre>',
    boost: 30,
  },
  {
    label: 'connect',
    type: 'Connect',
    detail:
      'chainable method to connect nodes to previously instantiated nodes. Takes a selector to find the nodes to connect to.\n' +
      '<pre><code>//create and connect sine->lowpass->dac\n' +
      '__().sine().lowpass().dac();\n' +
      '//create a sawtooth and connect to the lowpass instantiated above\n' +
      '__().saw().connect("lowpass");</code></pre>',
    boost: 50,
  },
  {
    label: 'remove',
    type: 'Connect',
    detail:
      'chainable method to stop, disconnect and remove the currently selected nodes. Takes a time in ms to schedule the node removal.\n' +
      '<pre><code>//create and connect sine->lowpass->dac\n' +
      '__().sine().lowpass().dac();\n' +
      '//remove the lowpass instantiated above in 100ms\n' +
      '__("lowpass").remove(100);</code></pre>',
    boost: 50,
  },
  {
    label: 'log',
    type: 'Debug',
    detail:
      'log selected nodes to console if any.\n' +
      '<pre><code>//create and connect sine -> lowpass -> dac\n' +
      '__().sine().lowpass().dac();\n' +
      '\n' +
      '//logs the [oscillatorNode] object to the console\n' +
      '__("sine").log()</code></pre>',
    boost: -50,
  },
  {
    label: 'size',
    type: 'Debug',
    detail:
      'return the length of selected nodes array\n' +
      '<pre><code>//create and connect sine -> lowpass -> dac\n' +
      '__().sine().lowpass().dac();\n' +
      '\n' +
      '//returns 2\n' +
      '__("sine,lowpass").size();</code></pre>',
    boost: -50,
  },
  {
    label: '_dumpState',
    type: 'Debug',
    detail: 'dump the node lookup object to the console\nworks in debug only',
    boost: -50,
  },
  {
    label: '_getNode',
    type: 'Debug',
    detail: 'debug method to get a node with a uuid\nworks in debug only',
    boost: -50,
  },
  {
    label: '_getNodeLookup',
    type: 'Debug',
    detail: 'debug method to get all nodes',
    boost: -50,
  },
  {
    label: '_setNodeLookup',
    type: 'Debug',
    detail:
      'debug method to set node UUIDs for a selector in the nodeLookup object.',
    boost: -50,
  },
  {
    label: 'ifUndef',
    type: 'Type',
    detail: 'Returns the 2nd argument if the 1st is undefined',
    boost: 0,
  },
  {
    label: 'isNotUndef',
    type: 'Type',
    detail: 'Returns true if not undefined',
    boost: 0,
  },
  {
    label: 'isUndef',
    type: 'Type',
    detail: 'Returns true if undefined',
    boost: 0,
  },
  {
    label: 'isObj',
    type: 'Type',
    detail: 'Returns true if param is an object',
    boost: 0,
  },
  {
    label: 'isNum',
    type: 'Type',
    detail: 'Returns true if param is a number',
    boost: 0,
  },
  {
    label: 'isStr',
    type: 'Type',
    detail: 'Returns true if param is a string',
    boost: 0,
  },
  {
    label: 'isArr',
    type: 'Type',
    detail: 'Returns true if param is an array',
    boost: 0,
  },
  {
    label: 'isFun',
    type: 'Type',
    detail: 'Returns true if param is a function',
    boost: 0,
  },
  {
    label: 'random_interval',
    type: 'Algorithmic',
    detail: 'execute a callback at random intervals within a range',
    boost: 60,
  },
  {
    label: 'random_envelope',
    type: 'Algorithmic',
    detail: 'create a adsr envelope with random values scaled to a length',
    boost: 60,
  },
  {
    label: 'fill_array',
    type: 'Algorithmic',
    detail: 'fill an array with some values',
    boost: 60,
  },
  {
    label: 'array_next',
    type: 'Algorithmic',
    detail:
      'advance thru array one step at a time.\n' +
      'start over when arriving at the end',
    boost: 60,
  },
  {
    label: 'chance',
    type: 'Algorithmic',
    detail: 'Returns a boolean based on percentage.',
    boost: 60,
  },
  {
    label: 'scales',
    type: 'Algorithmic',
    detail: 'Returns a musical scale/mode based on type',
    boost: 60,
  },
  {
    label: 'chords',
    type: 'Algorithmic',
    detail: 'Returns a musical scale/mode based on type',
    boost: 60,
  },
  {
    label: 'random_scale',
    type: 'Algorithmic',
    detail:
      'Return a random series of frequencies from randomly selected octaves from a given scale',
    boost: 60,
  },
  {
    label: 'random_arpeggio',
    type: 'Algorithmic',
    detail:
      'Return a random series of frequencies from a randomly selected octave from a given chord',
    boost: 60,
  },
  {
    label: 'shuffle',
    type: 'Algorithmic',
    detail: 'Takes a reference to an array, shuffles it\nand returns it',
    boost: 60,
  },
  {
    label: 'random',
    type: 'Algorithmic',
    detail: 'Returns a random number between min & max',
    boost: 60,
  },
  {
    label: 'throttle_factory',
    type: 'Algorithmic',
    detail:
      'Factory to create a throttling function that returns true when called every nth times',
    boost: 60,
  },
  {
    label: 'sequence_factory',
    type: 'Algorithmic',
    detail:
      'Factory to create a sequencing function that returns true when called every nth times',
    boost: 60,
  },
  {
    label: 'sequence',
    type: 'Algorithmic',
    detail:
      'Sequence - create a series of steps that take a function to execute and a time in minutes for when to execute it\n' +
      '\n' +
      '[See more sampler examples](examples/sequence.html)',
    boost: 60,
  },
  {
    label: 'reverb',
    type: 'Delay',
    detail:
      'Convolver Reverb\n\n[See more reverb examples](examples/delay.html)',
    boost: 80,
  },
  {
    label: 'delay',
    type: 'Delay',
    detail: 'Delay\n\n[See more delay examples](examples/delay.html)',
    boost: 80,
  },
  {
    label: 'comb',
    type: 'Delay',
    detail: 'Comb\n\n[See more reverb examples](examples/delay.html)',
    boost: 80,
  },
  {
    label: 'bitcrusher',
    type: 'Distortion',
    detail:
      'Bitcrusher\n\n[See more bitcrusher examples](examples/distortion.html)',
    boost: 85,
  },
  {
    label: 'ring',
    type: 'Distortion',
    detail:
      'Ring Modulator\n' +
      '\n' +
      '[See more ring modulator examples](examples/distortion.html)',
    boost: 85,
  },
  {
    label: 'overdrive',
    type: 'Distortion',
    detail:
      'Overdrive, waveshaper with additional parameters\n' +
      '\n' +
      '[See more overdrive examples](examples/distortion.html)',
    boost: 85,
  },
  {
    label: 'adsr',
    type: 'Envelope',
    detail:
      'Attack Decay Sustain Release envelope\n' +
      '\n' +
      '[See more adsr examples](examples/envelopes.html)\n' +
      '\n' +
      'Attack time is the time taken for initial run-up of level from nil to peak, beginning when the key is first pressed.\n' +
      'Decay time is the time taken for the subsequent run down from the attack level to the designated sustain level.\n' +
      "Sustain level is the level during the main sequence of the sound's duration, until the key is released.\n" +
      'Release time is the time taken for the level to decay from the sustain level to zero after the key is released.',
    boost: 0,
  },
  {
    label: 'lowpass',
    type: 'Filter',
    detail:
      'Lowpass Filter\n\n[See more lowpass examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'highpass',
    type: 'Filter',
    detail:
      'Highpass Filter\n\n[See more highpass examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'bandpass',
    type: 'Filter',
    detail:
      'Bandpass Filter\n\n[See more bandpass examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'lowshelf',
    type: 'Filter',
    detail:
      'Lowshelf Filter\n\n[See more lowshelf examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'highshelf',
    type: 'Filter',
    detail:
      'Highshelf Filter\n\n[See more highshelf examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'peaking',
    type: 'Filter',
    detail:
      'Peaking Filter\n\n[See more peaking examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'notch',
    type: 'Filter',
    detail: 'Notch Filter\n\n[See more notch examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'allpass',
    type: 'Filter',
    detail:
      'Allpass Filter\n\n[See more allpass examples](examples/filters.html)',
    boost: 90,
  },
  {
    label: 'mouse_movement',
    type: 'Interaction',
    detail:
      'Passes mouse move events to a callback. Tracks the movement of the mouse.\n' +
      'web audio',
    boost: 0,
  },
  {
    label: 'key_press',
    type: 'Interaction',
    detail:
      'Passes key press events to a callback. Tracks keyboard activity.\n' +
      'web audio',
    boost: 0,
  },
  {
    label: 'clip',
    type: 'Miscellaneous',
    detail: 'Clips audio level at 1/-1',
    boost: 0,
  },
  {
    label: 'dac',
    type: 'Miscellaneous',
    detail:
      'System out - destination with a master volume. Output is clipped if gain is 1 or less.',
    boost: 0,
  },
  {
    label: 'adc',
    type: 'Miscellaneous',
    detail: 'System in - input with a master volume',
    boost: 0,
  },
  {
    label: 'out',
    type: 'Miscellaneous',
    detail: 'System out - destination with a master volume\nAlias for dac',
    boost: 0,
  },
  {
    label: 'multi_out',
    type: 'Miscellaneous',
    detail:
      'System multi_out - destination with a master volume w/ multi-channel support',
    boost: 0,
  },
  {
    label: 'in',
    type: 'Miscellaneous',
    detail: 'System in - input with a master volume\nAlias for adc',
    boost: 0,
  },
  {
    label: 'panner',
    type: 'Miscellaneous',
    detail: 'Panner - simple stereo panner',
    boost: 0,
  },
  {
    label: 'sampler',
    type: 'Sampler',
    detail:
      'Sampler - sound file player\n' +
      '\n' +
      '[See more sampler examples](examples/sampler.html)',
    boost: 99,
  },
  {
    label: 'lfo',
    type: 'Modulator',
    detail:
      'Low Frequency Oscillator\n' +
      '\n' +
      '[See more LFO examples](examples/modulation.html)',
    boost: 0,
  },
  {
    label: 'stepper',
    type: 'Modulator',
    detail: 'Stepper\n\nfill an audio buffer with a series of discrete values.',
    boost: 0,
  },
  {
    label: 'noise',
    type: 'Noise',
    detail:
      'noise parametrized noise node\n' +
      '\n' +
      '[See more noise examples](examples/noise.html)',
    boost: 0,
  },
  {
    label: 'pink',
    type: 'Noise',
    detail: 'Pink Noise\n\n[See more noise examples](examples/noise.html)',
    boost: 0,
  },
  {
    label: 'white',
    type: 'Noise',
    detail: 'White Noise\n\n[See more noise examples](examples/noise.html)',
    boost: 0,
  },
  {
    label: 'brown',
    type: 'Noise',
    detail: 'Brown Noise\n\n[See more noise examples](examples/noise.html)',
    boost: 0,
  },
  {
    label: 'sine',
    type: 'Oscillator',
    detail:
      'Sine Wave Oscillator\n' +
      '\n' +
      '[See more oscillator examples](examples/oscillators.html)',
    boost: 0,
  },
  {
    label: 'square',
    type: 'Oscillator',
    detail:
      'Square Wave Oscillator\n' +
      '\n' +
      '[See more oscillator examples](examples/oscillators.html)',
    boost: 0,
  },
  {
    label: 'saw',
    type: 'Oscillator',
    detail:
      'Sawtooth Wave Oscillator\n' +
      '\n' +
      '[See more oscillator examples](examples/oscillators.html)',
    boost: 0,
  },
  {
    label: 'triangle',
    type: 'Oscillator',
    detail:
      'Triangle Wave Oscillator\n' +
      '\n' +
      '[See more oscillator examples](examples/oscillators.html)',
    boost: 0,
  },
  {
    label: 'frequency',
    type: 'Setters',
    detail:
      '[See more control examples](examples/control.html)\n' +
      '\n' +
      'Frequency setter convenience method',
    boost: 0,
  },
  {
    label: 'detune',
    type: 'Setters',
    detail:
      'Detune setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'type',
    type: 'Setters',
    detail:
      'Type setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'volume',
    type: 'Setters',
    detail:
      'Gain setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'fadeOut',
    type: 'Setters',
    detail:
      'Fade out convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'fadeIn',
    type: 'Setters',
    detail:
      'Fade in convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'time',
    type: 'Setters',
    detail:
      'Delay time setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'feedback',
    type: 'Setters',
    detail:
      'Feedback setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'speed',
    type: 'Setters',
    detail:
      'Speed setter convenience method\n' +
      '\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'drive',
    type: 'Setters',
    detail:
      'Drive setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'distortion',
    type: 'Setters',
    detail:
      'Distortion setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'q',
    type: 'Setters',
    detail:
      'q setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'pan',
    type: 'Setters',
    detail:
      'pan setter convenience method\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'gang_of_oscillators',
    type: 'Synth',
    detail:
      'gang_of_oscillators\n' +
      '\n' +
      'Just a bunch of oscillators\n' +
      '\n' +
      '[See more synth examples](examples/synth.html)',
    boost: 0,
  },
  {
    label: 'monosynth',
    type: 'Synth',
    detail:
      'monosynth\n' +
      '\n' +
      'Simple monophonic synth\n' +
      '\n' +
      '[See more synth examples](examples/synth.html)',
    boost: 0,
  },
  {
    label: 'polysynth',
    type: 'Synth',
    detail:
      'polysynth\n' +
      '\n' +
      'Simple polyphonic synth\n' +
      '\n' +
      '[See more synth examples](examples/synth.html)',
    boost: 0,
  },
  {
    label: 'play',
    type: 'Utility',
    detail:
      'Convenient way to say start everything\n' +
      '\n' +
      '[See more control examples](examples/control.html)',
    boost: 0,
  },
  {
    label: 'scale',
    type: 'Utility',
    detail:
      'Scale an input number between min & max to an output number between a min & max. Supports logarithmic or linear scaling.',
    boost: 0,
  },
  {
    label: 'sec2ms',
    type: 'Utility',
    detail: 'Converts a second value to millisecond value',
    boost: 0,
  },
  {
    label: 'ms2sec',
    type: 'Utility',
    detail: 'Converts a millisecond value to second value',
    boost: 0,
  },
  {
    label: 'ms2min',
    type: 'Utility',
    detail: 'Converts a millisecond value to minute value',
    boost: 0,
  },
  {
    label: 'min2ms',
    type: 'Utility',
    detail: 'Converts a minute value to a millisecond value',
    boost: 0,
  },
  {
    label: 'isSupported',
    type: 'Utility',
    detail: 'Returns a boolean true if the browser supports\nweb audio',
    boost: 0,
  },
  {
    label: 'pitch2freq',
    type: 'Utility',
    detail: 'Converts a pitch value to frequency',
    boost: 0,
  },
  {
    label: 'freq2pitch',
    type: 'Utility',
    detail: 'Converts a frequency to a pitch value',
    boost: 0,
  },
];
