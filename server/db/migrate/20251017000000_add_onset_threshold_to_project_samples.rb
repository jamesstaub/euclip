# How sensitive onset detection is for this sample, 0..1 (lower finds more, quieter onsets). Detection runs in
# the browser when the sample is loaded; only this setting is kept, not the onsets, which are derived from
# the audio and the threshold.
class AddOnsetThresholdToProjectSamples < ActiveRecord::Migration[7.0]
  def change
    add_column :project_samples, :onset_threshold, :float, null: false, default: 0.25
  end
end
