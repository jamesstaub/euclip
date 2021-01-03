import onstepScript from "../factories/onstep-script";

const samples = [
  {
    title: 'looping sample',
    description: 'with loop:true the sample will just infinitely repeat outside of the sequencer. ADSR triggers an envelope on each step',
    initScript:`
  __()
    .sampler({
      id: 'loopy',
      path: this.filepath,
      ui: 'slider',
      speed: 4,
      loop: true,//infinitely repeat
    })
    .adsr('fast')
    .channelStrip()
    .connect('#mixer');

  __('#loopy').start();
  
`,
    onstepScript:`if (data) {
  __('adsr').adsr('trigger');
}
`
  }
]
const lfos = [
  {
    title: 'modulate sampler',
    description: '',
    initScript: 
`__()
  .sampler({
    path: this.filepath,
    ui: 'multislider',
  })
  .channelStrip()
  .connect('#mixer');

  __().lfo({
    id: 'lfo-1',
    type: 'sine', // sine, sawtooth, square, triangle, pink
    frequency: 4, // Hz
    gain: 2,// LFO amplitude (max value for speed)
    modulates:'speed'
  }).connect(this.samplerSelector);

__('#lfo-1').start();

`,
    onstepScript:
`if (data) {
  this.playSample(index);
  // need to connect lfo to sampler on every step
  __('#lfo-1').connect(this.samplerSelector);
}`
  },
  {
    title: 'sampler speed',
    initScript:
`
__().sampler({path:this.filepath}).connect("#mixer")
__().lfo({modulates:"speed",frequency:1,gain:3}).connect("sampler");

__("lfo").start();
`,
    onstepScript:
`
__("lfo").connect("sampler");
if(data){
  __("sampler").stop().start();
}`
  }
];

const synths = [
  {
    title: 'synth ADSR',
    initScript:
`
// TODO: automatically clean up oscillators and LFOs to avoid need for .remove()
__('.my-sines').remove();
__('.my-envelopes').remove();

__().channelStrip({ id:'sineMixer' }).connect('#mixer');

// create 8 sine waves in a loop, each with an ADSR for envelop control
// connect them to the channel strip macro created above
for (var i = 0; i < 8; i++) {
  __().sine({
    id: 'sin-' + i,
    class: 'my-sines',
  })
  .adsr({
    class: 'my-envelopes'
  })
  .connect('#sineMixer')  
}
`,
    onstepScript:
`if (data) {
  __('.my-sines').start();

  // select all the adsr nodes, then call the method adsr() with "trigger" and array of 
  // attack(sec), decay(sec), sustain(gain), release(sec)
  __('.my-envelopes').adsr('trigger', [0.25, 0.1, 0.1, 1]);
  
  // loop over the 8 sine waves and change their frequency to a random note in a minor scale
  for (var i = 0; i < 8; i++) {
    var note = __.random_scale('minor', 3, 6);
    __('#sin-'+i).attr({ frequency: note });
  }
} else {
  __('my-envelopes').adsr('trigger', [0.01, 0.01, 0, 10]); 
}

`
  }
]

const presets = [...lfos, ...synths, ...samples];
export default presets