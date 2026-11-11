# `rate` is how many steps the sequence plays for each tick of the project's clock: 1 is the project's pace,
# 0.5 half of it, 2 double (the clock is divided or multiplied by cracked's loop; see Track#bindToSequencer).
# `max_value` is the highest value a step can hold: 1 is a plain on/off step, more lets a step choose between
# values (for a multi-sample kit, which sampler plays). The step values themselves live in `custom_sequence`.
class AddRateAndMaxValueToSequences < ActiveRecord::Migration[7.0]
  def change
    add_column :sequences, :rate, :float, null: false, default: 1.0
    add_column :sequences, :max_value, :integer, null: false, default: 1
  end
end
