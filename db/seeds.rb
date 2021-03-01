# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

admin = User.create!({
  first_name: "james",
  last_name: "staub",
  username: "euclip",
  email: "jamesstaub@gmail.com",
  password: "3uCl1p#",
  password_confirmation: "3uCl1p#",
})

project = Project.create_with_relations!({
  title: "Euclip Intro",
  slug: 'euclip-intro',
  creator: admin,
})


pc = PresetCollection.create!(title: "Sample", creator: admin)

[
  {
    title: "basic oneshot",
    init_script: InitScript.create!(safe_code: <<-EOS
__()
  .sampler({
    path: this.filepath,
  })
  .adsr('fast') // create an ADSR envelope
  .channelStrip() // connect to output
  .connect('#mixer');

__('#'+this.id).start();
EOS
),
    onstep_script: OnstepScript.create!(safe_code: <<-EOS
if (data) {
  __('adsr').adsr('trigger');
}
EOS
),
  },
  {
    title: "looping with ADSR envelope",
    init_script: InitScript.create!(safe_code: <<-EOS
__()
  .sampler({
    path: this.filepath,
    speed: 4, // play at 4x speed
    loop: true, //infinitely repeat
  })
  .adsr('fast') // create an ADSR envelope
  .channelStrip() // connect to output
  .connect('#mixer');

__('#'+this.id).start();
EOS
),
    onstep_script: OnstepScript.create!(safe_code: <<-EOS
if (data) {
  __('adsr').adsr('trigger');
}
EOS
),
  },
].each do |preset|
  Preset.create!(preset_collection: pc, **preset)
end