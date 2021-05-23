# Theory of operation
Euclip is an open-ended music making tool with a hybrid between a coding environment and traditional user interface. It's as a drum machine with it's wires exposed. The Script editors let you build samplers and synthesizers with custom audio signal chains and write musical logic for creating complex patterns.

Euclip projects resemble other Track-based DAWs, but where everything you can control on a track (sample playback, EQ parameters, reverb, LFOs, etc), can be controlled by either a Script or a UI control (like a slider or dial). The scripts that run on Euclip tracks use the Javascript-based music library (i_dropped_my_phone_the_screen_cracked)[https://github.com/billorcutt/i_dropped_my_phone_the_screen_cracked] (referred to here as Cracked).

## Tracks
A project consists of Tracks. Tracks are comprised of the following components:

### The `Setup` script
Here is where the sound source is defined. The basic anatomy of a Setup script is as follows:
[Sound Source Node] --> [Effects nodes] --> [Connect to Main output]

Every project has a **Main** track where the audio output is defined. All other tracks should *connect* their sources to the Main track.

The Cracked audio library provides a simple syntax for defining and connecting [https://developer.mozilla.org/en-US/docs/Web/API/AudioNode](Audio Nodes).

### The `Play` script
Once you have defined an audio signal chain in the Setup Script, use the Play script to map your audio nodes to the track's **Sequencer**

Define how your audio nodes behave with 

### Track Controls
After defining an audio signal chain in a track's Setup Script, Euclip will create Track Controls for each audio node you've defined. For example, if your Setup Script was something like this:
```
__().sampler({path: this.filepath}).overdrive().connect("dac");
```
After running the script you would see Track Controls appear to control the `speed` parameter of the `sampler` node, and `drive`, `color`, and `postCut` controls to control the `overdrive` node.

#### Track Control Options
Each Track control has an options menu where you can configure and customize it's range and appearance. Most Track Controls are numeric, meaning they have a `min` `max` and `default` range. You can customize this range to fine tune the modulation of a given audio node. For example if you have 2 tracks, each with a `sampler` connected to a `lowpass`, you may want to set the `frequency` TrackControl to a specific min-max range differently for a hihat than a kick drum. 

#### Multislider Track Controls
Unlike standard sliders, or number boxes, the `multislider` Track Control type allows you to program different values for each step of the given Track's step sequencer. `multislider` Track Controls are the easiest way to modulate and warp audio parameters without writing any code.

#### Track Controls and Scripts
The **Play** Script is responsible for applying the value of your Track Controls to your Audio Nodes. You can take advantage of this to write code to maipulate the Track Control values before they get applied. For example, say you have a `lowpass` filter on your track and the `frequency` Track Control is a `slider`. You can write a bit of code in your **play** script to slightly randomize the slider value on each step of the sequencer. 

```
// TODO: verify +update this example once fully implemented
controls["#lowpass-1"]["frequency] = controls["#lowpass-1"]["frequency] * __.random(1, 2)
```
What the above code is doing is grabbing the slider value of the `frequency` Track Control and multiplying it by a random number between 1 and 2, then re-assigning that new value to the `lowpass` `frequency` property of the `controls` object

The `playSample` helper does applies the `controls` under the hood, but you can modify the `controls` data object before calling `playSample`, and it will get applied. 


### Sequencer
By default Euclip tracks use a [https://www.computermusicdesign.com/simplest-euclidean-rhythm-algorithm-explained/#:~:text=Essentially%2C%20a%20euclidean%20rhythm%20consists,length%20of%20a%20rhythmic%20cycle.](Euclidean Rhythm Generator)
But you can manually change the sequence however you like.

<!-- Coming soon:
    multiple sequences per track
 -->

### Source view
-  - 
Each track is a wrapper for an audio signal chain. The step sequencers of each track are synced to the main (Loop Function)[https://billorcutt.github.io/i_dropped_my_phone_the_screen_cracked/cracked.html#loop].
...

## Audio Nodes
Audio nodes are the objects that make up your signal chain. The code written in the each track should setup a signal chain and use *selectors* to play and modulate on each step.

## Scripts
`cracked` and `__` are globally available variables which are the single instance of the cracked audio context. While Scripts are meant to be self-contained within a given track, your Cracked scripts can actually define audio nodes that connect to and modulate any other track in the project.


See the **Selectors** section for more.


### The Main Track


## Macros
Euclip provides a `channelStrip` macro which is a creates a default volume + panner node on each track.


## Scripts that create sounds and interfaces


Euclip scripts are javascript functions that provide access to the Cracked audio library. 

Tracks consist of 2 scripts: 1 to initialize the signal chain, and 1 to change parameters on each beat of the step sequencer. 

When the setup script initializes an audio signal chain, Euclip creates user interface objects (like sliders, number boxes) which give you easy access to control the audio nodes you created on that track.


## UI objects


### The ui attribute (advanced)
You can use the `ui` attribute when creating an audio node to specify what kind of interface objects to create.

...


## Euclip additions to cracked library
- `ui:` attribute
- `playSample()`
- `channelStrip()` macro
- `uniqueSelector` helper (tbd)
- `this.slider`

## Selectors
Selectors are used to set play or set attributes of various audio nodes. To "Select" one or more nodes means to tell the app which audio nodes to play or set parameters.

There are 3 types of selectors

### ID
`ID` selectors should be uniquely assigned to a single audio node and are useful for manipulating a single node at a time.

an ID selector always has a `#` at the beginning of the name.

**example**
setup a sinewave playing into an ADSR envelope node
```
__()
  .sine(440)
  .adsr({ id: 'my-first-envelope' })

__()
  .sine(550)
  .adsr({ id: 'my-second-envelope' })

```

`id` selector used to trigger one or the other ADSR envelopes depending on the `data` variable
```
if (data === 1) {
__('#my-first-envelope')
}
if (data == 2) {
__('#my-second-envelope')
}
```

### class
`class` selectors can be assigned to one or more nodes and can be used to update parameters on multiple nodes at once.

a class selector always has a `.` at the beginning of the name.  

**example** 
setup 2 different samplers with filters
```
__()
  .sampler()
  .lowpass({ class: 'my-filter' })


__()
  .sampler()
  .bandpass({ class: 'my-filter'})

```

`class` selectors used to set frequency of 2 different filters
```
__('.my-filter').attr({
  frequency: 440,
  q: 4,
})
```

### node name
`node name` selectors will select every instance of a given node. The selector is a string of the node name without any special character.

**example**
setup a bunch of sine waves in a loop
```
  __()
    .sampler()
    .lowpass()

__()
    .sampler()
    .lowpass()

```

Set all lowpass filters to the same frequency. 
```
__('lowpass').attr({ frequency: 440})
```


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
