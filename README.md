# euclip

`ember s --ssl-key "/Users/admin/.ssh/server.key" --ssl-cert "/Users/admin/.ssh/server.crt"`


## TODO:

Tracks 
- copy paste tracks
- new track menu (different init script types)

Track Controls
- wrapper: 
  - min, max default controls
  - "functions" [buttons to apply prest shapes like triangle, sine or randomize]
  - copy/paste single control
  - range presets (melodic scales, )
- element/nodes to implement
  - Envelope node : breakpoint nexus element
  - LFOs as controls
  - panner node : dial
  - XY controls (filters)

Scripts
  - rebuild collection of example scripts
  - add helper function to set speed as a factor of the sequencer length (for loops)
  - add helper to access UI value in script, so you could do speed: `slider val + __.rand()`
  

Files
  - set local filepath


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
