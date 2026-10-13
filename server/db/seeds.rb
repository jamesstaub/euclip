# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
puts "CREATE USERS!"
admin = User.create!({
  first_name: "james",
  last_name: "staub",
  username: "euclip",
  email: "jamesstaub@gmail.com",
  password: "3uCl1p#",
  password_confirmation: "3uCl1p#",
})

james = User.create!({
  first_name: "james",
  last_name: "staub",
  username: "james",
  email: "jamesstaub+test@gmail.com",
  password: "3uCl1p#",
  password_confirmation: "3uCl1p#",
})


sample_collection = PresetCollection.create!(title: "Sampler", creator: admin)
sample_collection = PresetCollection.create!(title: "Filters", creator: admin)
sample_collection = PresetCollection.create!(title: "Delay/Reverb", creator: admin)
sample_collection = PresetCollection.create!(title: "Modulation", creator: admin)
synth_collection = PresetCollection.create!(title: "Synthesis", creator: admin)
macro_collection = PresetCollection.create!(title: "Macros", creator: admin)

# effects 
# all
# ...individual


# LFOs 
# sampler playback speed
# gain
# modulate other LFOs
# oscilators 

[
  {
    title: "Basic Oneshot",
    init_script: InitScript.create!(safe_code: <<-EOS
__().sampler({
    path: this.files[0],
  })
  .channelStrip()
  .connect('#main-output')
    
EOS
),
    onstep_script: OnstepScript.create!(safe_code: <<-EOS
// the `data` variable is either true or false depending on which step of the sequence we're on
// if there's a beat on this step of the sequence, play the sample
if (data) {
  this.playSourceNodes(); 
}

/** 
* `this.playSourceNodes()` is equivalent to writing
* `__(this.trackSelector).start()`
* but with some euclip-specific behavior. 
* if you've given your sampler an ID 
* you can also trigger it like so:
* `__('#my-sampler-id').start()`
**/ 

EOS
),
  },
  {
    title: "Looping with ADSR envelope",
    init_script: InitScript.create!(safe_code: <<-EOS
/** 
start the sample with loop set to `true`
the adsr can be triggered in the Play script
**/ 
__()
  .sampler({
    path: this.files[0],
    speed: 4, // play at 4x speed
    loop: true,
  })
  .adsr('fast') // create an ADSR envelope
  .channelStrip() // connect to output
  .connect('#main-output');

// start this track's sampler (a source makes no sound until it is started)
this.select('sampler').start();


/** 
 try using the controls to change the playback speed while looping.
**/

EOS
),
    onstep_script: OnstepScript.create!(safe_code: <<-EOS
if (data) {
  // plays the sampler and opens this track's envelope(s) (this.playADSRNodes() does just the envelopes)
  this.play();
} else {
  this.stop();
}

EOS
),
  },
  {
    title: "Pitch jitter (reads the speed control)",
    init_script: InitScript.create!(safe_code: <<-EOS
__().sampler({
    path: this.files[0],
  })
  .channelStrip()
  .connect('#main-output')
EOS
),
    onstep_script: OnstepScript.create!(safe_code: <<-EOS
if (data) {
  // read the speed slider, and offset it for this step only.
  // the slider keeps its value, so the jitter never builds up
  const speed = this.controls.sampler.speed;
  // __.random(-50, 50) is cracked's random whole number, so this is +/- 5%
  this.controls.sampler.speed = speed * (1 + __.random(-50, 50) / 1000);
  this.playSourceNodes();
}
EOS
),
  },
  {
    title: "Reverse",
    init_script: InitScript.create!(safe_code: <<-EOS
__().sampler({
  path: this.files[0],
  reverse: true
})
.channelStrip()
.connect('#main-output')
  
EOS
),
    onstep_script: OnstepScript.create!(safe_code: <<-EOS
if (data) {
  this.playSourceNodes(); 
}
EOS
),
  },
].each do |preset|
  Preset.create!(preset_collection: sample_collection, **preset)
end


# TODO separate this out into a separate script to run/update file records on production
SearchableFile.destroy_all
SearchableDirectory.destroy_all
SearchableDirectory.create(name: '/')
file_names = File.readlines('db/seeds/mp3filepaths.txt').map(&:chomp)
file_names.map{|file_path| FileService.create_record(file_path) }
