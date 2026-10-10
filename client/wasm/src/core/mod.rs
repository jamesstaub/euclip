pub trait AudioProcessor {
    fn process(
        &mut self,
        input_channels: *const *const f32,
        num_input_channels: usize,
        output_channels: *mut *mut f32,
        num_output_channels: usize,
        num_samples: usize,
    );
    fn set_parameter(&mut self, name: &str, value: f32);
    fn get_parameter(&self, name: &str) -> f32;
    fn get_parameter_descriptors(&self) -> Vec<crate::core::ParameterDescriptor>;
    fn destroy(&mut self);
}

pub struct ParameterDescriptor {
    pub name: String,
    pub default: f32,
    pub min: f32,
    pub max: f32,
}