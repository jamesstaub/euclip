// audio_node.rs

use wasm_bindgen::prelude::*;
use js_sys::Array;
use wasm_bindgen::JsValue;
use js_sys::Object;
use js_sys::Reflect;

/// A simple example processor for demonstration purposes.
#[wasm_bindgen]
pub struct SimpleProcessor {
    param: f32,
}

#[wasm_bindgen]
impl SimpleProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SimpleProcessor {
        SimpleProcessor { param: 0.0 }
    }

    pub fn process(
        &mut self,
        _input_channels: *const *const f32,
        _num_input_channels: usize,
        _output_channels: *mut *mut f32,
        _num_output_channels: usize,
        _num_samples: usize,
    ){
        // You'd put real audio processing code here.
    }

    pub fn set_parameter(&mut self, name: &str, value: f32) {
        if name == "param" {
            self.param = value;
        }
    }

    pub fn get_parameter(&self, name: &str) -> f32 {
        if name == "param" {
            return self.param;
        }
        0.0
    }

    // This method now returns the correct parameter descriptors
    pub fn get_parameter_descriptors(&self) -> Vec<JsValue> {
        let name = "param";
        let default = self.param;
        let min = 0.0;  // Define min value
        let max = 1.0;  // Define max value
        
        // Create the descriptor as a JavaScript object
        let obj = js_sys::Object::new();
        js_sys::Reflect::set(&obj, &JsValue::from_str("name"), &JsValue::from_str(name)).unwrap();
        js_sys::Reflect::set(&obj, &JsValue::from_str("default"), &JsValue::from_f64(default as f64)).unwrap();
        js_sys::Reflect::set(&obj, &JsValue::from_str("min"), &JsValue::from_f64(min as f64)).unwrap();
        js_sys::Reflect::set(&obj, &JsValue::from_str("max"), &JsValue::from_f64(max as f64)).unwrap();

        vec![JsValue::from(obj)] // Return the descriptor in a Vec
    }

    pub fn destroy(&mut self) {
        // Cleanup logic (if any)
    }
}


/// The AudioNode struct wraps a processor and exposes control methods.
#[wasm_bindgen]
pub struct AudioNode {
    processor: SimpleProcessor,
}

#[wasm_bindgen]
impl AudioNode {
    #[wasm_bindgen(constructor)]
    pub fn new() -> AudioNode {
        AudioNode {
            processor: SimpleProcessor { param: 0.0 },
        }
    }

    pub fn process(
        &mut self,
        input_channels: *const *const f32,
        num_input_channels: usize,
        output_channels: *mut *mut f32,
        num_output_channels: usize,
        num_samples: usize,
    ) {
        self.processor.process(
            input_channels,
            num_input_channels,
            output_channels,
            num_output_channels,
            num_samples,
        );
    }

    pub fn set_parameter(&mut self, name: &str, value: f32) {
        self.processor.set_parameter(name, value);
    }

    pub fn get_parameter(&self, name: &str) -> f32 {
        self.processor.get_parameter(name)
    }


    #[wasm_bindgen(js_name = getParameterDescriptors)]
    pub fn get_parameter_descriptors_js(&self) -> js_sys::Array {
        let array = js_sys::Array::new();
    
        for descriptor in self.processor.get_parameter_descriptors() {
            // Ensure the descriptor is a JS object before attempting to extract properties
            if let Some(obj) = descriptor.dyn_ref::<js_sys::Object>() {
                let name = js_sys::Reflect::get(&obj, &JsValue::from_str("name")).unwrap().as_string().unwrap_or_default();
                let default = js_sys::Reflect::get(&obj, &JsValue::from_str("default")).unwrap().as_f64().unwrap_or(0.0) as f32;
                let min = js_sys::Reflect::get(&obj, &JsValue::from_str("min")).unwrap().as_f64().unwrap_or(0.0) as f32;
                let max = js_sys::Reflect::get(&obj, &JsValue::from_str("max")).unwrap().as_f64().unwrap_or(0.0) as f32;
    
                // Now you have the parameters, so add them to the array
                let param_obj = js_sys::Object::new();
                js_sys::Reflect::set(&param_obj, &JsValue::from_str("name"), &JsValue::from_str(&name)).unwrap();
                js_sys::Reflect::set(&param_obj, &JsValue::from_str("default"), &JsValue::from_f64(default as f64)).unwrap();
                js_sys::Reflect::set(&param_obj, &JsValue::from_str("min"), &JsValue::from_f64(min as f64)).unwrap();
                js_sys::Reflect::set(&param_obj, &JsValue::from_str("max"), &JsValue::from_f64(max as f64)).unwrap();
    
                array.push(&param_obj);
            }
        }
    
        array
    }
    
    pub fn destroy(&mut self) {
        self.processor.destroy();
    }
}
