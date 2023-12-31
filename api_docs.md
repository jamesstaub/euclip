# EUCLIP javascript API

## Overview

## Audio Nodes
You can create, connect and change any parameter of audio nodes from the script editors.

### Create Nodes
The Setup Script is wher you write code to build and connect audio nodes into signal chains. The Setup script is a function that gets called once when the track is loaded.

### Playback
The Play script is where you write code to control the playback of the audio nodes. The Play script is a function that gets called on each step of the sequencer.

#### The Play Script
Start, Stop, nodes in the chain

Start individual nodes

**EUCLIP Helper Functions**
```
this.play()
this.stop()
this.connect()
```

### Connect To Main output

### Automation: Change Node Parameters
`__().attr({param: value})`


## Working With Data From the UI
### Track Controls
You can access the values from Track Controls in your script.

This allows you to mutate track control values and pass them to the audio nodes. 

js:
```js
// 
    `__('sampler').attr({speed: controls('.sampler').speed + __.rand()})`
```