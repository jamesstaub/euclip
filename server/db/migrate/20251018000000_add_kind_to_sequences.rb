# A sequence is euclidean (hits/steps/offset), binary (the digits of `value`, 0..127) or on/off
# (`on_steps` hits then `off_steps` rests, `times` times over). The pattern itself is computed in the browser.
class AddKindToSequences < ActiveRecord::Migration[7.0]
  def change
    add_column :sequences, :kind, :string, null: false, default: 'euclidean'
    add_column :sequences, :value, :integer, null: false, default: 0
    add_column :sequences, :on_steps, :integer, null: false, default: 1
    add_column :sequences, :off_steps, :integer, null: false, default: 1
    add_column :sequences, :times, :integer, null: false, default: 1
  end
end
