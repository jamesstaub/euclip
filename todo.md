# TODO


investigate cracked's `ignoreGrid` property to investigate scheduling bugs

go live list:
- do a pass at auto-selectors
  - attempt to automatically use sampler filepath if not supplied
  - add `connect()` to channelStrip

- finish node config refactor (add ADSR, fix compressor threshold)
- ember-responsive fixes for small + touch screen
  - sidebar service to auto open-close when small
  - collapse track list items

### USER PLANS
given DB row limit, must enforce project and track limitations per user

### Scripts
BUG; if possible clear the "cmd-z"  undo state when changing tracks, since code mirror doesn't get re-initialized

#### scope + variables

TODO: revisit the cracked sequence `bind` method. Does euclip correctly keep the bound nodes in the selector scope for each track?
<!-- -->


- rename variables to match the tabs 
  (source.filepath instead of this.filepath)
  - `source.slices[]`
  - controls instead of this.controls
  - `sequence.array` ? 
  - sequence.hits, steps, offset
  can these be settable?


- implement variables in script scope to access TrackControl values
  - - This could use existing selectors to access track nodes for controls.
  - API getters could be `this.source`, `this.controls`, `this.sequence`
  - or could be selector getters like `this.source('#my-sampler')`
  - or even `track.source()` or 
      Track Controls Example API:
      ```

      sequence
      controls('sampler').speed
      
      source().start // return first sourcw node
      source('#my-sampler').end

      
      
      ```


  - -  you could do `{speed: controls('.sampler').speed + __.rand()}`
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
  
  - Source editor for dealing with sample start/end and loop settings. 
  - - create an array structure for segmenting an audio sample
  - - implement an onset detection + sample chopper
  the add a namespace for array of timestamps for slice points, 
  ```
  __this.select('sampler')__.attr({start: this.slices[0], end: this.slices[1]})
  or 
  __.attr({speed: .1}) 

  ```
  
 
implement a "uiState" object on track models which hold currentTabIdx values for various tabs
to keep recent state in tact when returning to a track

### Track Nodes
  - hover over node tabs to show cracked uuid and selectors
  - info menu should show example of how to mutate track controls


### Track Controls

  - add a property: "apply on: step/all"
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

  - preset ideas:
    mutate this.controls (or `controls()` perhaps?) for sampler start/end time to create granular loops that
    are subdivisions of the BPM or slices of a loop file

### Project
  - Save "Snapshots" (need to plan this out to work with concurrent editing, permissions)
  - Arrange mode: chain multiple projects together
  - Rails Action Cables for live editing

### Sequences
- FIXME: when updating a sequence (clicking a square)
  - dont make the UI wait for the API request. 
- right click a sequence step to set it's value.
- add a menu to determine how sequence values get set
  - 0 / 1 
  - true false

- implement an `this.updateSequence()` method
  - alias `data` variable to `step` for clarity in PLAY function
  - right click sequence square to edit it's value 
  - in sequence menu, dropdown for "default step value"
    - 1
    - true
    - custom

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

  - File listings should have a preview button
  - Search results should also have a "go to folder" button
  

### Misc featurs:
  - multiplayer websocket editing
  - contributor chat box
  - "assistant" in chat window suggesting next steps with actions


### Other ideas
- key bindings and tab-navigation. look at ember-focus-trap

- create a  "mixer view" for mixing all tracks that have a `channelStrip` macro

- Sequence
  - - add a sequence BPM divider
  - - add reverse/pingpong mode for tracks
  - - ability for track to have many chainable sequences (perhaps with their own script editor for the chaining logic!?)

  - - in addition to Euclidean tab, add some sorta generative/evolving/automated UI
  - - add a "Binary" sequence which converts 1-127 into a binary sequence

- Separate the `offset` from the euclidean algo. 
  offset should work for custom rhyhtms

### bugs
Script editor states are wonky, stale value, debounce, revert not working


"no source node"
sometimes when a filepath is not set, or the trackcontrol for the filepath is not ready, the sampler node will fail to create. fix this by falling back to silence.mp3 so it still creates a sampler node

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

Mobile UI:
on phones, the verticle view should be simple play controls 
and message to rotate phone to horizontal. there it should be a minimal track list and
footer view

Current Track selection could be a native dropdown menu