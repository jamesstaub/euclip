# euclip

local development against api server using a self signed certificate
`ember s --proxy https://localhost:3000  --secure-proxy=false`
`rails server -b 'ssl://127.0.0.1:3000?key=/Users/admin/.ssh/server.key&cert=/Users/admin/.ssh/server.crt'`

## TODO:

Tracks 

### features
- new track dropdown menu options (different script presets)
  - build preset models in rails
  - a preset can have one of each script type
  - the preset menu should overlay the scripts sidebar and use a material ui table with checkboxes indicating which scripts
  - a toggle should default to "replace existing script"
  - users can save their own scripts to their "collections"


Track Nodes
  - Track NodeTab UI
  - hover over node tabs to show cracked uui and selectors
  - 

Track Controls
  - Move Sampler filepath to track control (with source node attribute)
  - When a sampler is present, add a new footer menu button for Sample Editor (start, end, slice manager)
  - Oscillators also get Track Controls to control their type. 


Project
  - Save "Snapshots"
  - Arrange mode: chain multiple projects together
  - Rails Action Cables for live editing

Sequences
  - implement a "Matrix View", which replaces the standard track list with an intanace of 
  nexus sequencer with rows for each track. inherit the Nexus matrix model to allow use of 
  nexus matrix mutation functions.
  - despite the matrix data structure, different track sequence lengths can be supported in this view
  by overlaying a length-slider on each row of the matrix. 
  the computed value of this matrix model which ultimately gets saved on the track can
  get trimmed to a given duration


### bugs
Track Controls
- wrapper:
  - "functions" [buttons to apply prest shapes like triangle, sine or randomize]
  - copy/paste single control


- element/nodes to implement
  - Envelope node : breakpoint nexus element or group of sliders
  - LFOs as controls
  - panner node : dial
  - multidimensional controls (XY slider, breakpoint)
  - use for filters, LFOs, 

- Sequence
  - - add a sequence BPM divider
  - - add reverse/pingpong mode for tracks
  - - ability for track to have many chainable sequences (perhaps with their own script editor for the chaining logic!?)
    - - implement a Sequence model that belongs to Track. move existing seq properties there.
  - - in addition to Euclidean tab, add some sorta generative/evolving/automated UI

Scripts
  ### features
  -  create a  "mixer view" for mixing all tracks that have a `channelStrip` macro
  - rebuild collection of example scripts
  - add helper function to set speed as a factor of the sequencer length (for loops)
  - add helper to access UI value in script, so you could do speed: `slider val + __.rand()`
    - - Math.sin(sliderValue)
  - - access to slider value in functions would effectively allow non-linear sliders
  - add examples of __.ms2freq using the track tempo to control LFO speeds

 - User testing question:
  - what is the best way to manage an onstep script that is mutating a particular parameter at certain times,
    and the UI is mutating the same parameter at other times?
    - should track controls have a `disable` feature?
    - or should the script explicitly call `applyTrackControl` so it is extra clear?
    - - and if so, perhaps the trackControl should have some UI indicating if applyTrackControl is beging called (subtle indicator light)


  ### bugs
  - duplicate a track, set channelstrip gain to 0, restart sequencer, gain sounds back at 1

  - use the LFO example, then add an additional gain node
  - - result is the channelStrip gain not working anymore

  - - finish refactor of track-based selectors, probably remove this.samplerSelector
  - - this.samplerSelector is confusing bc. maybe instead a `uniqueSelector()` helper
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



Files
  - drag and drop UI for local sounds
  - set filepath local for library 
  - waveform UI control for slicing (array of start times)
  - support a dropbox URL or local folder

Misc featurs:
  - multiplayer websocket editing
  - contributor chat box
  - assistant in chat window suggesting next steps with actions

## Documentation:

Cracked scripts globally
  - script contents tied to lifecycle of track 
  - but otherwise are all part of same global object

scripts and sliders order of effect on nodes



### writing scripts
init:
  - custom ui options

onstep:
  - index, data, array args



## Globals
`cracked` and `__` are globally available as the single instance of the cracked audio context

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with npm)
* [Ember CLI](https://ember-cli.com/)
* [Google Chrome](https://google.com/chrome/)

## Installation

* `git clone <repository-url>` this repository
* `cd euclip`
* `npm install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).
* Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Running Tests

* `ember test`
* `ember test --server`

### Linting

* `npm run lint:hbs`
* `npm run lint:js`
* `npm run lint:js -- --fix`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying
