//! # Bitcrusher Audio Processor
//!
//! This processor applies a bitcrushing effect to the audio input. It reduces the bit depth of
//! the audio signal and modulates the output using a frequency-based "phaser" effect.

use crate::audio_node::SimpleProcessor;
use crate::core::AudioProcessor;
use crate::core::ParameterDescriptor;
use crate::parameter::Parameter;
use std::f32::consts::PI;
pub use fastrand;

pub struct Bitcrusher {
    bits: u32,             // Bit depth for the bitcrushing effect
    frequency: f32,        // Frequency for the phaser effect (used to modulate the quantization)
    step: f32,             // Step size based on the bit depth (controls the amount of quantization)
    phaser: f32,           // Internal phaser used for frequency modulation
    last_sample: f32,      // The last quantized audio sample
    mix: f32,              // Wet/dry mix for blending the processed signal with the original signal
    quant_method: QuantizationMethod, // Method of quantization (Round, Truncate, Floor, Ceil, Random)
}

// Enum to define different quantization methods (e.g., Round, Truncate, Floor, Ceil)
pub enum QuantizationMethod {
    Round,
    Truncate,
    Floor,
    Ceil,
    Random,
}

impl Bitcrusher {
    // Constructor for initializing the Bitcrusher with bit depth, frequency, mix, and quantization method
    pub fn new(bits: u32, frequency: f32, mix: f32, quant_method: QuantizationMethod) -> Self {
        let step = 1.0 / (2.0_f32).powf(bits as f32); // Step size based on bit depth
        Self {
            bits,
            frequency,
            step,
            phaser: 0.0,
            last_sample: 0.0,
            mix,
            quant_method,
        }
    }

    // Set the frequency of the bitcrusher (modulates the phaser effect)
    pub fn set_frequency(&mut self, frequency: f32) {
        self.frequency = frequency;
    }

    // Set the bit depth of the bitcrusher
    pub fn set_bits(&mut self, bits: u32) {
        self.bits = bits;
        self.step = 1.0 / (2.0_f32).powf(bits as f32);
    }

    // Set the mix control for blending the processed and unprocessed signal
    pub fn set_mix(&mut self, mix: f32) {
        self.mix = mix;
    }

    // Set the quantization method (Round, Truncate, Floor, Ceil)
    pub fn set_quant_method(&mut self, quant_method: QuantizationMethod) {
        self.quant_method = quant_method;
    }

    // Helper method to apply the selected quantization method
    fn quantize(&self, sample: f32) -> f32 {
        match self.quant_method {
            QuantizationMethod::Round => self.step * (sample / self.step).round(),
            QuantizationMethod::Truncate => self.step * (sample / self.step).trunc(),
            QuantizationMethod::Floor => self.step * (sample / self.step).floor(),
            QuantizationMethod::Ceil => self.step * (sample / self.step).ceil(),
            QuantizationMethod::Random => {
                let random_offset = (fastrand::f32() - 0.5) * self.step;
                self.step * ((sample + random_offset) / self.step).round()
            }

        }
    }
}

impl AudioProcessor for Bitcrusher {
    // Process the audio signal, applying bitcrushing and phaser effects
    fn process(
        &mut self,
        input_channels: *const *const f32,
        num_input_channels: usize,
        output_channels: *mut *mut f32,
        num_output_channels: usize,
        num_samples: usize,
    ) {
        // Dereference the input to get a pointer to the first channel of audio data
        let input = unsafe { *input_channels };

        // Create a slice of the input channel
        let input_channel = unsafe { std::slice::from_raw_parts(input, num_samples) };

        // Dereference output_channels to get a mutable pointer to the output
        let output = unsafe { &mut *output_channels };

        let output_channel = unsafe { std::slice::from_raw_parts_mut(*output, num_samples) };


        for i in 0..num_samples {
            // Apply the bitcrushing effect based on bit depth
            self.phaser += self.frequency;

            if self.phaser >= 1.0 {
                self.phaser -= 1.0;
                // Process the sample
                self.last_sample = self.quantize(input_channel[i]);
            }

            // Output the processed (bit-crushed) sample
            output_channel[i] = self.last_sample;
            
        }
    }

    // Set the parameters for the processor (e.g., frequency, bit depth, mix, quantization method)
    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "frequency" => self.set_frequency(value),
            "bits" => self.set_bits(value as u32),
            "mix" => self.set_mix(value),
            _ => eprintln!("Unknown parameter: {}", name),
        }
    }

    // Get the current value of a parameter (e.g., frequency, bits, mix)
    fn get_parameter(&self, name: &str) -> f32 {
        match name {
            "frequency" => self.frequency,
            "bits" => self.bits as f32,
            "mix" => self.mix,
            _ => {
                eprintln!("Unknown parameter: {}", name);
                0.0
            }
        }
    }

    // Return the descriptors for the parameters (e.g., name, default value, min, max)
    fn get_parameter_descriptors(&self) -> Vec<ParameterDescriptor> {
        vec![
            ParameterDescriptor {
                name: "frequency".to_string(),
                default: self.frequency,
                min: 20.0,
                max: 20000.0,
            },
            ParameterDescriptor {
                name: "bits".to_string(),
                default: self.bits as f32,
                min: 1.0,
                max: 16.0,
            },
            ParameterDescriptor {
                name: "mix".to_string(),
                default: self.mix,
                min: 0.0,
                max: 1.0,
            },
        ]
    }

    // Clean up any resources (not needed in this case)
    fn destroy(&mut self) {
        // No cleanup needed for this simple processor
    }
}
