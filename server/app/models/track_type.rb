# The kinds of track a user can add ("New Track" menu). Each one is a set of starting scripts
# (setup + play), sequences and control defaults; creating a track copies them onto the track,
# where they are ordinary, editable scripts. Plain data in code (not DB rows) so it is versioned
# with the app and needs no data migration.
#
# `controls` is applied by the client once the track's audio exists (the server doesn't know the
# audio nodes): "node_type.attr" => { unit: "<unit label>" }.
class TrackType
  attr_reader :key, :title, :description, :init_script, :onstep_script, :sequences, :controls

  def initialize(key:, title:, description:, init_script:, onstep_script:, sequences: [{ hits: 0, steps: 8, offset: 0 }], controls: {})
    @key = key
    @title = title
    @description = description
    @init_script = init_script
    @onstep_script = onstep_script
    @sequences = sequences
    @controls = controls
  end

  DEFAULT_KEY = 'sampler'.freeze

  SAMPLER = new(
    key: 'sampler',
    title: 'Sampler',
    description: 'Plays one sample on each hit of the sequence.',
    init_script: <<~JS,
      __()
        .sampler({
          path: this.files[0],
        })
        .lowpass()
        .gain()
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS
      // `data` is true on the steps that have a hit: play the sample on each one.
      // this.play() starts the sampler with the current values of its controls.
      if (data) {
        this.play();
      }

      /**
        Three layers set a parameter, and they stack:

        1. The number in the Setup script, e.g. .lowpass({ frequency: 800 }), is the control's
           starting value. Change the number and the control starts over from it.
        2. The sliders in the Source and Controls tabs override it. "reset" goes back to the script's number.
        3. Here, this.controls reads a slider's current value and lets you offset it for THIS STEP ONLY:
           the slider doesn't move and next step starts from it again, so nothing builds up.

        Try it: replace the code above with this for a little random pitch drift on every hit.
        (controls are addressed by node type, or by the id you give a node: .lowpass({ id: 'filter' }))

        if (data) {
          this.controls.sampler.speed *= 1 + (Math.random() - 0.5) * 0.04;
          this.play();
        }

        __('sampler').attr({ speed: 2 }) also works, but the sliders are re-applied at the start of
        every step, so a value set that way doesn't last. Prefer this.controls.
      **/
    JS
  )

  LOOPED_SAMPLER = new(
    key: 'looped_sampler',
    title: 'Looped sampler',
    description: 'Loops a sample. Its speed is set in "Loop Sync" units, so the loop stretches to fit the sequence at any tempo.',
    init_script: <<~JS,
      // A looping sample player. The speed control uses "Loop Sync" units: the sample is
      // stretched or squeezed so one pass lasts exactly one cycle of the sequence.
      __()
        .sampler({
          path: this.files[0],
          loop: true,
        })
        .lowpass()
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS,
      // Restart the loop on every hit. Between hits it keeps looping.
      if (data) {
        this.play({ loop: true });
      }
    JS
    sequences: [{ hits: 1, steps: 8, offset: 0 }],
    controls: { 'sampler.speed' => { unit: 'Loop Sync' } }
  )

  MULTI_SAMPLER = new(
    key: 'multi_sampler',
    title: 'Multi-sample kit',
    description: 'Four sampler pads, each with its own file, sharing one channel strip. Hits play the pads in turn.',
    init_script: <<~JS,
      // Four sampler "pads". Pick a file for each in the Source tab: slot n of `this.files`
      // is the file for pad n + 1. All pads share one bus with a single channel strip.
      __().gain({ id: 'pads' }).channelStrip().connect('#main-output');

      [0, 1, 2, 3].forEach((i) => {
        __()
          .sampler({ id: 'pad' + (i + 1), path: this.files[i] })
          .connect('#pads');
      });
    JS
    onstep_script: <<~JS,
      // Every hit plays the next pad in turn (round-robin), so the files play as one instrument.
      // Tip: add a second sequence and use `sequenceIndex` to give a pad its own rhythm:
      //   this.playSourceNode(sequenceIndex)
      // Tip: each pad has its own controls, addressed by the ids in the Setup script, e.g. to
      // pitch one pad down for a single step: this.controls.pad2.speed *= 0.5
      if (data) {
        this.playSourceNode(index % 4);
      }
    JS
    sequences: [{ hits: 4, steps: 8, offset: 0 }]
  )

  HUMANIZED_SAMPLER = new(
    key: 'humanized_sampler',
    title: 'Humanized sampler',
    description: 'Every hit varies a little in pitch, level and brightness around wherever the sliders are set.',
    init_script: <<~JS,
      // The numbers here are the starting values of the matching controls (see the Source and
      // Controls tabs). The `id`s let the play script find a node by name: this.controls.level, ...
      __()
        .sampler({
          path: this.files[0],
        })
        .lowpass({ id: 'filter', frequency: 8000 })
        .gain({ id: 'level', gain: 0.8 })
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS,
      // Humanize: each hit wanders a little around the sliders' CURRENT values.
      //
      // Reading a control gives its slider value. Assigning to it offsets the audio for this step
      // only: the slider stays where you left it and the next step starts from it again, so the
      // randomness never drifts or builds up. Move a slider and the whole thing re-centres.
      const around = (amount) => 1 + (Math.random() - 0.5) * 2 * amount;

      if (data) {
        this.controls.sampler.speed *= around(0.03); // +/- 3% pitch
        this.controls.level.gain *= around(0.15);    // +/- 15% level
        this.controls.filter.frequency *= around(0.25); // +/- 25% brightness
        this.play(); // plays with the offsets above
      }
    JS
    sequences: [{ hits: 4, steps: 8, offset: 0 }]
  )

  FILTER_SWEEP = new(
    key: 'filter_sweep',
    title: 'Filter sweep',
    description: 'A sample through a low-pass filter whose cutoff sweeps up and down once per cycle, centred on the cutoff slider.',
    init_script: <<~JS,
      // The cutoff slider (Controls tab) starts at 1200 Hz because of the number below.
      // Edit it here and the slider resets to the new number; drag the slider and it overrides it.
      __()
        .sampler({
          path: this.files[0],
          loop: true,
        })
        .lowpass({ id: 'filter', frequency: 1200, q: 6 })
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS,
      // Sweep the cutoff over the sequence, one octave either side of the slider.
      // this.controls.filter.frequency is the slider's value, so dragging it moves the whole sweep.
      // The red ring on the slider shows where the sweep is right now; the slider itself doesn't move.
      const cutoff = this.controls.filter.frequency;
      const position = Math.sin((index / array.length) * 2 * Math.PI); // -1 .. 1 over one cycle
      this.controls.filter.frequency = cutoff * Math.pow(2, position);

      if (data) {
        this.play({ loop: true });
      }
    JS
    sequences: [{ hits: 1, steps: 8, offset: 0 }]
  )

  OSCILLATOR_ARP = new(
    key: 'oscillator_arp',
    title: 'Oscillator arpeggio',
    description: 'A sine oscillator with an envelope that arpeggiates a scale above a root note set by its frequency control.',
    init_script: <<~JS,
      // An oscillator is a sound source, so its controls are in the Source tab.
      // The frequency control is the ROOT note: 220 Hz to start with.
      __()
        .sine({ id: 'lead', frequency: 220 })
        .adsr('fast')
        .channelStrip()
        .connect('#main-output');

      // An oscillator makes no sound until it is started. It runs from here on; the envelope (ADSR)
      // keeps it silent until a hit in the play script opens it. this.select() limits this to THIS
      // track's oscillators (cracked's own play() would start every node on the page).
      this.select('sine').start();
    JS
    onstep_script: <<~JS,
      // Each hit plays the next note of a major pentatonic scale. Notes are ratios of the root,
      // so changing the frequency control transposes the whole line.
      //
      // Assigning this.controls.lead.frequency sets the pitch for this step only; the control keeps
      // the root, and the next step reads it back.
      const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];

      if (data) {
        const root = this.controls.lead.frequency;
        this.controls.lead.frequency = root * scale[index % scale.length];
        this.playADSRNodes(); // open the envelope
      }
    JS
    sequences: [{ hits: 5, steps: 8, offset: 0 }]
  )

  POLYSYNTH = new(
    key: 'polysynth',
    title: 'Polysynth',
    description: 'A polyphonic synthesizer (cracked\'s polysynth macro) playing a pentatonic scale.',
    init_script: <<~JS,
      // cracked's `polysynth` macro makes a new voice for every note you play.
      // Try osc_type: 'sine' | 'square' | 'sawtooth' | 'triangle'
      __()
        .polysynth({
          osc_type: 'sawtooth',
          lp_frequency: 1800,
          gain_volume: 0.6,
        })
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS,
      // On every hit, play a note from a minor pentatonic scale. The step picks the note.
      const scale = [0, 3, 5, 7, 10]; // semitones above the root
      const root = 48; // MIDI note number (C3)

      if (data) {
        const pitch = root + scale[index % scale.length] + 12 * (index % 2);

        // Note: cracked's selection is global state shared by everything that runs. Select the synth
        // right before every call, including inside the timeout: a selection stored in a variable
        // would by then point at whatever was selected last, and the note would never be released.
        this.select('polysynth').polysynth('noteOn', { pitch, velocity: 100, envelope: [0.01, 0.1, 0.5] });

        setTimeout(() => this.select('polysynth').polysynth('noteOff', { pitch }), this.stepMs * 2);
      }
    JS
    sequences: [{ hits: 5, steps: 8, offset: 0 }]
  )

  ALL = [SAMPLER, LOOPED_SAMPLER, MULTI_SAMPLER, HUMANIZED_SAMPLER, FILTER_SWEEP, OSCILLATOR_ARP, POLYSYNTH].freeze

  def self.all
    ALL
  end

  def self.find(key)
    ALL.find { |type| type.key == key.to_s }
  end

  # the type for a key, or the default sampler when the key is missing/unknown
  def self.fetch(key)
    find(key) || find(DEFAULT_KEY)
  end

  def self.valid?(key)
    !find(key).nil?
  end
end
