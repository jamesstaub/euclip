// parameter.rs
use wasm_bindgen::prelude::*;

#[derive(Debug)]
pub struct Parameter {
    pub name: String,
    pub default: f32,
    pub min: f32,
    pub max: f32,
    pub value: f32,
}

impl Parameter {
    pub fn new(name: String, default: f32, min: f32, max: f32) -> Self {

        Self {
            name,
            default,
            min,
            max,
            value: default,
        }
    }

    pub fn set(&mut self, v: f32) {
        self.value = v.clamp(self.min, self.max);
    }

    pub fn get(&self) -> f32 {
        self.value
    }
}

#[wasm_bindgen]
pub struct WasmParameter {
    param: Parameter,
}

#[wasm_bindgen]
impl WasmParameter {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, default: f32, min: f32, max: f32) -> WasmParameter {
    
        WasmParameter {
            param: Parameter::new(name, default, min, max),
        }
    }

    pub fn set(&mut self, value: f32) {
        self.param.set(value);
    }

    pub fn get(&self) -> f32 {
        self.param.get()
    }

    pub fn name(&self) -> String {
        self.param.name.to_string()
    }

    pub fn default(&self) -> f32 {
        self.param.default
    }

    pub fn min(&self) -> f32 {
        self.param.min
    }

    pub fn max(&self) -> f32 {
        self.param.max
    }
} 
