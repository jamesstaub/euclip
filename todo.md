# TODO
- drum searching implementation
- initial drum sound not loading correctly (batch track controls?)

investigate cracked's `ignoreGrid` property to investigate scheduling bugs

go live list:
- do a pass at auto-selectors
  - attempt to automatically use sampler filepath if not supplied
  - 
- finish node config refactor (add ADSR, fix compressor threshold)
- ember-responsive fixes for small + touch screen
  - sidebar service to auto open-close when small
  - collapse track list items

- simplify interface control
  - remove dial option. single or multislider options as icon selectsion




### Scripts
#### scope + variables
- implement variables in script scope to access TrackControl values
  - - This could use existing selectors to access track nodes for controls eg.
      controls['.sampler-1']['speed']
  - -  you could do speed: `controls('.sampler') + __.rand()`
- Fix brittle use of order for track selectors:s  See not note on `uniqueSelector` in models/track-node.js

- node `class`
  either implement support for multiple classes per node (split classname by spaces)
  or dont allow spaces in classnames (update on laod)

#### helpers
- add helper function to set speed as a factor of the sequencer length (for loops)
- - access to slider value in functions would effectively allow non-linear sliders
- add examples of __.ms2freq using the track tempo to control LFO speeds
- the `playSample()` helper should be responsible for calling `applyTrackControls` internally, but can take an options argument to override/mutate them.

- new track dropdown menu options (different script presets)
  - build preset models in rails
  - a preset can have one of each script type
  - the preset menu should overlay the scripts sidebar and use a material ui table with checkboxes indicating which scripts
  - a toggle should default to "replace existing script"
  - users can save their own scripts to their "collections"


### Track Footer
  - each section (source, sequencer, controls) should display "Script Variables" in a list
  styled in the same color as the syntax highlight in the actual script editor
  - the Script Wrapper gets a collapsable menu with all available variables and their values

  - Source editor for dealing with sample start/end and loop settings. 
  - - create an array structure for segmenting an audio sample
  - - implement an onset detection + sample chopper

implement an ephemeral "uiState" object on track models which hold currentTabIdx values for various tabs
to keep recent state in tact when returning to a track

### Track Nodes
  - hover over node tabs to show cracked uuid and selectors
  - info menu should show example of how to mutate track controls

### Track Controls
  - Oscillators also get Track Controls to control their type. (if the script contains a generic oscillator macro)
  - control menu should contain a text input for the target selector of a track control. By default this should populate with the related TrackNode's unique selector
    but could be a dropdown of all selectors (filtered by those that are controllable by this control type
  - with track control selectors implemented, the track attrOnStep can use the selector method
  - element/nodes to implement
    - Envelope node : breakpoint nexus element or group of sliders
    - multidimensional controls (XY slider, breakpoint)
    - use for filters, LFOs, 
  - in addition to default attributes, some Track Controls might update their defaults depending on their context: such as an LFO's default gain ranges when connected to an oscillator vs a sampler. In such case the LFO node could read the defaults from the modulating node


### Presets:
  - finish implementing, include all node attributes in presets
    (at least for one section of them to learn the nodes)

### Project
  - Save "Snapshots" (need to plan this out to work with concurrent editing, permissions)
  - Arrange mode: chain multiple projects together
  - Rails Action Cables for live editing

### Sequences
  - implement a "Matrix View", which replaces the standard track list with an intanace of 
  nexus sequencer with rows for each track. inherit the Nexus matrix model to allow use of 
  nexus matrix mutation functions.
  - despite the matrix data structure, different track sequence lengths can be supported in this view
  by overlaying a length-slider on each row of the matrix. 
  the computed value of this matrix model which ultimately gets saved on the track can
  get trimmed to a given duration

- implement "undo delete" 
- - use ember-concurrency to wait before calling save on the deleted record, show a "toast" with restore button

### Files
  - drag and drop UI for local sounds
  - set filepath local for library 
  - waveform UI control for slicing (array of start times)
  - support a dropbox URL or local folder

### Misc featurs:
  - multiplayer websocket editing
  - contributor chat box
  - "assistant" in chat window suggesting next steps with actions


### Other ideas
- create a  "mixer view" for mixing all tracks that have a `channelStrip` macro

- Sequence
  - - add a sequence BPM divider
  - - add reverse/pingpong mode for tracks
  - - ability for track to have many chainable sequences (perhaps with their own script editor for the chaining logic!?)

  - - in addition to Euclidean tab, add some sorta generative/evolving/automated UI
  - - add a "Binary" sequence which converts 1-127 into a binary sequence


### bugs
-- master track doesn't update when new nodes are added (until playback is restarted)
- - need more solid sequencer-awareness when adding/removing tracks (use generators to start on a particular beat)

-- when deleting a track, the script sidebar closes but property is not re-set so the button to re-open sidebar disappears

  - use the LFO example, then add an additional gain node
  - - result is the channelStrip gain not working anymore
      which reads `this.id` internally, allowing you to duplicate tracks an preserve their unique inner-references
  - when a node is initialized with attributes eg.
  - verify if `.remove()` is needed in init scripts (or do they all get torn down)
  ```
  .filter({
    frequency: 440,
    q: 20
  })
  ```
  then the track-controls should also be initialized with those as the default values


## Platform improvements

implement a Forum with Threaded

also look at Kofi https://ko-fi.com/gold?ref=home

