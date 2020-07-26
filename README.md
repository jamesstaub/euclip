# euclip

`ember s --ssl-key "/Users/admin/.ssh/server.key" --ssl-cert "/Users/admin/.ssh/server.crt"`


## TODO:

Tracks 

### features
- new track menu (different script presets)

### bugs
sequence stops on add new track
- changing a track's sample causes the playhead to go out of sync (try to duplicate a track, then change the sound file)

Track Controls
- wrapper: 
  - "functions" [buttons to apply prest shapes like triangle, sine or randomize]
  - copy/paste single control

- element/nodes to implement
  - Envelope node : breakpoint nexus element
  - LFOs as controls
  - panner node : dial
  - XY controls (filters)

- Sequence
  - - add a sequence BPM divider
  - - add reverse/pingpong mode for tracks
  - - ability for track to have many chainable sequences (perhaps with their own script editor for the chaining logic!?)
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

  ### bugs

  - implement track-node order in onCreateNode callback to ensure they appear in the right order when nodes get removed/edited.
  - track node 404 errors when trying to update removed nodes

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
