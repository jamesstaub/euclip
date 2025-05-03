use wasm_bindgen::prelude::*;
use crate::processors::bitcrusher::{Bitcrusher as CoreBitcrusher, QuantizationMethod};

#[wasm_bindgen]
pub struct Bitcrusher {
    inner: CoreBitcrusher,
}

#[wasm_bindgen]
impl Bitcrusher {
    #[wasm_bindgen(constructor)]
    pub fn new(bits: u32, frequency: f32) -> Bitcrusher {
        Bitcrusher {
            inner: CoreBitcrusher::new(bits, frequency, 0.5, QuantizationMethod::Round), // Default mix: 0.5, Default quant_method: Round
        }
    }

    #[wasm_bindgen]
    pub fn set_bits(&mut self, bits: u32) {
        self.inner.set_bits(bits);
    }

    #[wasm_bindgen]
    pub fn set_frequency(&mut self, frequency: f32) {
        self.inner.set_frequency(frequency);
    }

    #[wasm_bindgen]
    pub fn set_mix(&mut self, mix: f32) {
        self.inner.set_mix(mix);
    }

    #[wasm_bindgen]
    pub fn set_quant_method(&mut self, method: &str) {
        let parsed = match method {
            "Round" => QuantizationMethod::Round,
            "Truncate" => QuantizationMethod::Truncate,
            "Floor" => QuantizationMethod::Floor,
            "Ceil" => QuantizationMethod::Ceil,
            "Random" => QuantizationMethod::Random,
            _ => return, // ignore invalid input
        };
        self.inner.set_quant_method(parsed);
    }
}
