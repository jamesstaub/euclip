pub mod processors;
use std::f32;
use wasm_bindgen::prelude::*;
use std::os::raw::c_char;
use std::ffi::{CStr, CString};
use crate::ffi::processors::bitcrusher::Bitcrusher; // Import the Bitcrusher struct

use crate::audio_node::{AudioNode, SimpleProcessor};

macro_rules! cstr_to_string {
    ($ptr:expr) => {
        unsafe {
            if $ptr.is_null() {
                String::from("null")
            } else {
                CStr::from_ptr($ptr).to_string_lossy().into_owned()
            }
        }
    };
}

#[no_mangle]
pub extern "C" fn constructor(sample_rate: f64) -> *mut AudioNode {
    // Sample rate can be passed into SimpleProcessor::new if needed
    let node = AudioNode::new(); // You can later accept a param if needed
    Box::into_raw(Box::new(node))
}

#[no_mangle]
pub extern "C" fn process(
    user_data: *mut AudioNode,
    input_channels: *const *const f32,
    num_input_channels: i32,
    output_channels: *mut *mut f32,
    num_output_channels: i32,
    num_samples: i32,
) {
    let node = unsafe {
        assert!(!user_data.is_null());
        &mut *user_data
    };
    node.process(
        input_channels,
        num_input_channels as usize,
        output_channels,
        num_output_channels as usize,
        num_samples as usize,
    );
}

#[no_mangle]
pub extern "C" fn set_parameter(
    user_data: *mut AudioNode,
    name_ptr: *const c_char,
    value: f32,
) {
    let node = unsafe {
        assert!(!user_data.is_null());
        &mut *user_data
    };
    let name_str = cstr_to_string!(name_ptr);
    node.set_parameter(&name_str, value);
}

#[no_mangle]
pub extern "C" fn get_parameter(
    user_data: *mut AudioNode,
    name_ptr: *const c_char,
) -> f32 {
    let node = unsafe {
        assert!(!user_data.is_null());
        &mut *user_data
    };
    let name_str = cstr_to_string!(name_ptr);
    node.get_parameter(&name_str)
}

#[no_mangle]
pub extern "C" fn destroy(user_data: *mut AudioNode) {
    if !user_data.is_null() {
        unsafe {
            let _ = Box::from_raw(user_data);
        }
    }
}

#[no_mangle]
pub extern "C" fn get_parameter_descriptors(
    user_data: *mut AudioNode,
    names_ptr: *mut *mut *mut c_char,
    default_values_ptr: *mut *mut f32,
    num_parameters_ptr: *mut i32,
) {
    let node = unsafe {
        assert!(!user_data.is_null());
        &mut *user_data
    };

    // Fetch the parameter descriptors (the JS method version)
    let descriptors_js = node.get_parameter_descriptors_js();

    let num_params = descriptors_js.length() as i32;
    unsafe {
        *num_parameters_ptr = num_params;

        // Use Layout::array to get the correct layout for allocating memory
        let names_array_layout = std::alloc::Layout::array::<*mut c_char>(num_params as usize)
            .unwrap(); // Unwrap the Result to get the Layout
        let names_array = std::alloc::alloc(names_array_layout) as *mut *mut c_char;

        let default_values_layout = std::alloc::Layout::array::<f32>(num_params as usize)
            .unwrap(); // Unwrap the Result to get the Layout
        let default_values = std::alloc::alloc(default_values_layout) as *mut f32;

        if names_array.is_null() || default_values.is_null() {
            eprintln!("Memory allocation failed in get_parameter_descriptors");
            return;
        }

        // Convert from raw pointers to slices
        let names = std::slice::from_raw_parts_mut(names_array, num_params as usize);
        let default_values_slice = std::slice::from_raw_parts_mut(default_values, num_params as usize);

        // Iterate over the descriptors and populate the allocated arrays
        for (i, param) in descriptors_js.iter().enumerate() {
            let param_obj = param.dyn_ref::<js_sys::Object>().unwrap();

            // Extract name and default from the JS object
            let name = js_sys::Reflect::get(&param_obj, &JsValue::from_str("name"))
                .unwrap()
                .as_string()
                .unwrap_or_default();

            names[i] = CString::new(name).unwrap().into_raw() as *mut c_char;
            default_values_slice[i] = js_sys::Reflect::get(&param_obj, &JsValue::from_str("default"))
                .unwrap()
                .as_f64()
                .unwrap_or(0.0) as f32;
        }

        *names_ptr = names_array;
        *default_values_ptr = default_values;
    }
}
