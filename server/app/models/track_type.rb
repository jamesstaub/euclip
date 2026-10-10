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
      if (data) {
        this.play();
      } else {
        // this.stop();
      }

      /** Examples: try uncommenting these **/

      /**
      if (data) {
        this.play({loop: true});
      } else {
        this.select('sampler').attr({loop: false});
      }

      this.select('sampler').attr({speed: index})

      **/

      /**
        this.play() is a shortcut for __('sampler').stop().attrs({}).play()
        under the hood this.play() also makes sure to apply the current parameters from the Track Controls

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
      if (data) {
        this.playSourceNode(index % 4);
      }
    JS
    sequences: [{ hits: 4, steps: 8, offset: 0 }]
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
        const synth = this.select('polysynth');
        synth.polysynth('noteOn', { pitch, velocity: 100, envelope: [0.01, 0.1, 0.5] });
        // release before the next step so voices don't pile up
        setTimeout(() => synth.polysynth('noteOff', { pitch }), 150);
      }
    JS
    sequences: [{ hits: 5, steps: 8, offset: 0 }]
  )

  ALL = [SAMPLER, LOOPED_SAMPLER, MULTI_SAMPLER, POLYSYNTH].freeze

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
