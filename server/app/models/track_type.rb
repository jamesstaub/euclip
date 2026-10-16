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
        (controls are addressed by node type: this.controls.lowpass.frequency; use this.controls[0] etc. to pick
        between several nodes of one type. Avoid giving nodes an { id: ... }: it is a selector for the whole page, so
        a duplicated track would clash with it. this.select('lowpass') and this.selector('lowpass') find this track's own.)

        // __.random(min, max) is cracked's random whole number: -20..20 here, so +/- 2% after the division
        if (data) {
          this.controls.sampler.speed *= 1 + __.random(-20, 20) / 1000;
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
    description: 'Four samplers, each with its own file, sharing one channel strip. Hits play the samplers in turn.',
    init_script: <<~JS,
      // Four samplers. Pick a file for each in the Source tab: slot n of `this.files`
      // is the file for sampler n + 1. All samplers share one bus (a gain) with a single channel strip.
      __().gain().channelStrip().connect('#main-output');

      // Connect each sampler to THIS track's gain. (An id selector, like #bus, matches the gain of every track, so
      // duplicating this track would wire its samplers into both buses; this.selector('gain') is only this track's.)
      [0, 1, 2, 3].forEach((i) => {
        __()
          .sampler({ path: this.files[i] })
          .connect(this.selector('gain'));
      });
    JS
    onstep_script: <<~JS,
      // Every hit plays the next sampler in turn (round-robin), so the files play as one instrument.
      // Tip: add a second sequence and use `sequenceIndex` to give a sampler its own rhythm:
      //   this.playSourceNode(sequenceIndex)
      // Tip: play one sampler differently for a single step, e.g. the second one at half speed:
      //   this.playSourceNode(1, { speed: 0.5 })
      if (data) {
        this.playSourceNode(index % 4);
      }
    JS
    sequences: [{ hits: 4, steps: 8, offset: 0 }]
  )

  CHOPPED_LOOP = new(
    key: 'chopped_loop',
    title: 'Chopped loop',
    description: 'A drum loop cut into slices at its hits (onsets), played back in a shuffled order that changes every bar.',
    init_script: <<~JS,
      // Pick a loop (any recording of several hits) in the Source tab. euclip finds where the hits are and
      // draws them as slice markers on the waveform; the "onset threshold" under it sets how sensitive that
      // is (lower finds more, quieter hits), and "snap" makes the start/end markers jump to the slices.
      //
      // loop: true makes a slice keep repeating until the next hit; with loop: false a slice plays on past
      // its end, into the next ones, until the next hit cuts it off.
      __()
        .sampler({
          path: this.files[0],
          loop: true,
        })
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS,
      // Every step plays one slice of the loop. The sampler's startSlice and endSlice controls choose a region
      // by SLICE NUMBER (0, 1, 2, ...), separate from its absolute start and end (in seconds), which stay as set.
      //   this.controls.sampler.sliceCount   how many slices the loop has (0 until it has been analysed)
      //   this.controls.sampler.slices       where each one is: [[start, end], ...] in seconds
      //   this.bar                           which pass through the sequence this is: 0, 1, 2, ...
      //   this.state                         remembers values from step to step (the rest of `this` is rebuilt)
      //
      // The order is worked out at the start of each bar with cracked's helpers:
      //   __.fill_array(n, fn)   an array of n values, fn(i) for each: [0, 1, 2, ...] here
      //   __.shuffle(array)      mixes an array up (in place)
      //   __.random(min, max)    a random whole number from min to max
      //   __.chance(percent)     true that percent of the time

      const sampler = this.controls.sampler;
      const slices = sampler.sliceCount;
      const STUTTER = 30; // percent: how often the random pattern repeats the slice it just played

      if (slices > 0) {
        if (index === 0 || !this.state.order) {
          const inOrder = __.fill_array(slices, (i) => i);
          const patterns = [
            () => inOrder, // as recorded
            () => __.shuffle(inOrder.slice()), // shuffled
            () => inOrder.slice().reverse(), // backwards
            () => {
              // random slices, now and then stuttering (repeating the one before)
              let last = 0;
              return inOrder.map(() => {
                if (!__.chance(STUTTER)) last = __.random(0, slices - 1);
                return last;
              });
            },
          ];
          // a different pattern each bar, round and round
          this.state.order = patterns[this.bar % patterns.length]();
        }

        // this step's slice: set both slice controls to it (this step only; the controls keep their values)
        const slice = this.state.order[index % slices];
        sampler.startSlice = slice;
        sampler.endSlice = slice;
      }

      if (data) {
        this.play({ loop: true });
      }
    JS
    sequences: [{ hits: 8, steps: 8, offset: 0 }]
  )

  HUMANIZED_SAMPLER = new(
    key: 'humanized_sampler',
    title: 'Humanized sampler',
    description: 'Every hit varies a little in pitch, level and brightness around wherever the sliders are set.',
    init_script: <<~JS,
      // The numbers here are the starting values of the matching controls (see the Source and
      // Controls tabs). The play script finds each node by its type: this.controls.lowpass, this.controls.gain.
      __()
        .sampler({
          path: this.files[0],
        })
        .lowpass({ frequency: 8000 })
        .gain({ gain: 0.8 })
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS,
      // Humanize: each hit wanders a little around the sliders' CURRENT values.
      //
      // Reading a control gives its slider value. Assigning to it offsets the audio for this step
      // only: the slider stays where you left it and the next step starts from it again, so the
      // randomness never drifts or builds up. Move a slider and the whole thing re-centres.
      // __.random(-100, 100) is a random whole number from -100 to 100, so this is 1 +/- `amount`
      const around = (amount) => 1 + (__.random(-100, 100) / 100) * amount;

      if (data) {
        this.controls.sampler.speed *= around(0.03); // +/- 3% pitch
        this.controls.gain.gain *= around(0.15);    // +/- 15% level
        this.controls.lowpass.frequency *= around(0.25); // +/- 25% brightness
        // __.chance(20) is true one time in five: now and then a hit is a soft "ghost" note
        if (__.chance(20)) this.controls.gain.gain *= 0.4;
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
        .lowpass({ frequency: 1200, q: 6 })
        .channelStrip()
        .connect('#main-output')
    JS
    onstep_script: <<~JS,
      // Sweep the cutoff over the sequence, one octave either side of the slider.
      // this.controls.lowpass.frequency is the slider's value, so dragging it moves the whole sweep.
      // The red ring on the slider shows where the sweep is right now; the slider itself doesn't move.
      const cutoff = this.controls.lowpass.frequency;
      const position = Math.sin((index / array.length) * 2 * Math.PI); // -1 .. 1 over one cycle
      this.controls.lowpass.frequency = cutoff * Math.pow(2, position);

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
        .sine({ frequency: 220 })
        .adsr('fast')
        .channelStrip()
        .connect('#main-output');

      // An oscillator makes no sound until it is started. It runs from here on; the envelope (ADSR)
      // keeps it silent until a hit in the play script opens it. this.select() limits this to THIS
      // track's oscillators (cracked's own play() would start every node on the page).
      this.select('sine').start();
    JS
    onstep_script: <<~JS,
      // Each hit plays the next note of a minor scale above the root (the frequency control), going round.
      // __.scales('minor') is the scale as semitones above the root: [0, 2, 3, 5, 7, 8, 10]
      // (also: 'major', 'wholetone', 'overtone', 'lydian', 'mixolydian' and 'ionian').
      //
      // Assigning this.controls.sine.frequency sets the pitch for this step only; the control keeps
      // the root, and the next step reads it back.
      const scale = __.scales('minor');

      if (data) {
        const root = this.controls.sine.frequency;
        // __.chance(20) is true one time in five: that note goes up an octave
        const semitones = scale[index % scale.length] + (__.chance(20) ? 12 : 0);
        this.controls.sine.frequency = root * Math.pow(2, semitones / 12);
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
      // On every hit, play a note from a minor scale. The step picks the note; __.chance(30) (true 30% of the
      // time) sends it up an octave. __.scales('minor') is the scale as semitones above the root.
      const scale = __.scales('minor');
      const root = 48; // MIDI note number (C3)

      if (data) {
        const pitch = root + scale[index % scale.length] + (__.chance(30) ? 12 : 0);

        // Note: cracked's selection is global state shared by everything that runs. Select the synth
        // right before every call, including inside the timeout: a selection stored in a variable
        // would by then point at whatever was selected last, and the note would never be released.
        this.select('polysynth').polysynth('noteOn', { pitch, velocity: 100, envelope: [0.01, 0.1, 0.5] });

        // release before the next step so voices don't pile up (`this.stepMs` is the length of a step)
        setTimeout(() => this.select('polysynth').polysynth('noteOff', { pitch }), this.stepMs * 0.8);
      }
    JS
    sequences: [{ hits: 5, steps: 8, offset: 0 }]
  )

  ALL = [SAMPLER, LOOPED_SAMPLER, MULTI_SAMPLER, CHOPPED_LOOP, HUMANIZED_SAMPLER, FILTER_SWEEP, OSCILLATOR_ARP, POLYSYNTH].freeze

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
