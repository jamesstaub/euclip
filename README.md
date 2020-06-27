# euclip

`ember s --ssl-key "/Users/admin/.ssh/server.key" --ssl-cert "/Users/admin/.ssh/server.crt"`


## TODO:

Tracks 
- copy paste tracks
- new track menu (different script presets)
- BUG:  changing a track's sample causes the playhead to go out of sync (try to duplicate a track, then change the sound file)

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
  - implement a `.connect(this.mixer)` to create uniform track gain slider
  or it could be a `__().channelout()` macro which is a `gain`, `panner` and `connect(master)`
    -  this would also support a master mixer view for all tracks
  - rebuild collection of example scripts
  - add helper function to set speed as a factor of the sequencer length (for loops)
  - add helper to access UI value in script, so you could do speed: `slider val + __.rand()`
  - add examples of __.ms2freq using the track tempo to control LFO speeds

  - access to slider value in functions would effectively allow non-linear sliders
    - Math.sin(sliderValue)
    - in that case should the application of the slider value be exposed to the on step function? alternatively, it remains in the background, but can be overwritten by time the onstep function is called
  
  - rather than footer, script UI button should be on each track flushed right, open sidebar



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
