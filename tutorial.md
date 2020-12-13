# Theory of operation

## Scripts that create sounds and interfaces
Euclip is an open-ended music coding environment with a few assumptions baked in to help get started quickly.

A project consists of Tracks. Each track is a wrapper for an audio signal chain. The step sequencers of each track are synced to the project's (Loop function)[link to __.loop() docs].

Euclip scripts are javascript functions that provide access to the Cracked audio library. 

Tracks consist of 2 scripts: 1 to initialize the signal chain, and 1 to change parameters on each beat of the step sequencer. 

When the setup script initializes an audio signal chain, Euclip creates user interface objects (like sliders, number boxes) which give you easy access to control the audio nodes you created on that track.

You can use the `ui` attribute when creating an audio node to specify what kind of interface objects to create.


## UI objects
Euclip uses the Nexus JS interface library. Currently, just a few Nexus elements are supported, but more will be added soon.

### The ui attribute
...


## Euclip additions to cracked library
- `ui:` attribute
- `playSample()`
- `channelStrip()` macro
- `uniqueSelector` helper (tbd)
- `this.slider`

## Selectors
### overview

### sampler is a special case
this.samplerSelector
<!-- discussion of selectors
    TODO: should there be a universal strategy for auto-selectors ?
    or only support samplerSelector etc
 -->


## Code-driven User Interface
In Euclip, almost everything that controls sound is created with code. The code associated with each track creates the UI controls that you see.

# initializing signal chain
- channelStrip() helper
- - creates nodes

- playSample() helper
- - explain different trade offs for using the helper, 
- - 

- this.slider usage example

# on step script

if there on step script is modifying an audio node's property it will override whatever state the slider is in. 
