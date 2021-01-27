# euclip

local development against api server using a self signed certificate
`ember s --proxy https://localhost:3000  --secure-proxy=false`
`rails server -b 'ssl://127.0.0.1:3000?key=/Users/admin/.ssh/server.key&cert=/Users/admin/.ssh/server.crt'`


### Scripts
#### scope + variables
- implement variables in script scope to access TrackControl values
  - - This could use existing selectors to access track nodes for controls eg.
      controls['.sampler-1']['speed']
  - -  you could do speed: `controls('.sampler') + __.rand()`

- finish refactor of track-based selectors, probably remove this.samplerSelector

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

### Track Nodes
  - hover over node tabs to show cracked uuid and selectors
  - info menu should show example of how to mutate track controls

### Track Controls
  - Oscillators also get Track Controls to control their type. (if the script contains a generic oscillator macro)
  - control menu should contain a text input for the target selector of a track control. By default this should populate with the related TrackNode's unique selector
    but could be a dropdown of all selectors (filtered by those that are controllable by this control type
  - with track control selectors implemented, the track attrOnStep can use the selector method

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

### Other ideas
- create a  "mixer view" for mixing all tracks that have a `channelStrip` macro


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


### bugs
- Channel strip Gain not working (likely conflicting with other gain nodes)
- second to last track halts when adding new track.
- - need more solid sequencer-awareness when adding/removing tracks (use generators to start on a particular beat)

  - use the LFO example, then add an additional gain node
  - - result is the channelStrip gain not working anymore
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

## Deploying
`deploy-to-rails.sh` is a helper scipt that assumes the euclip-api repo exists in the same directory as this repo. This script will run build a production version of this app
and copy it to the `/public` directory in the rails repo. 

From there, the rails app will need to be committed and pushed to heroku. Note the local server should not be running when this command is run.


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
