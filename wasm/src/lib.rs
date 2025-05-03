mod utils;
mod parameter;
mod audio_node;
pub mod processors; // <- The actual logic processors like Bitcrusher
pub mod ffi;
pub mod core;


use wasm_bindgen::prelude::*;

pub use parameter::*;
pub use audio_node::*;


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, euclip-wasm!");
}

