// src/audio/worklets/bitcrusher-worklet.ts

// @ts-ignore - Assume global init done already (e.g., via <script> or import before context setup)
declare const wasm: any;

class BitcrusherProcessor extends AudioWorkletProcessor {
  bitcrusher: any;
  inputPtr: number;
  outputPtr: number;
  bufferSize: number;
  inputBuffer: Float32Array;
  outputBuffer: Float32Array;

  constructor() {
    super();

    // Hardcoded buffer size; should match what your WASM expects
    this.bufferSize = 128;

    // Allocate memory for one channel's samples (adjust if you want multichannel)
    this.inputPtr = wasm.__wbindgen_malloc(this.bufferSize * 4);
    this.outputPtr = wasm.__wbindgen_malloc(this.bufferSize * 4);

    this.inputBuffer = new Float32Array(
      wasm.memory.buffer,
      this.inputPtr,
      this.bufferSize
    );

    this.outputBuffer = new Float32Array(
      wasm.memory.buffer,
      this.outputPtr,
      this.bufferSize
    );

    this.bitcrusher = new wasm.Bitcrusher();
    this.bitcrusher.set_parameter("bits", 6);
    this.bitcrusher.set_parameter("frequency", 0.5);

    this.port.onmessage = (event) => {
      const { type, name, value } = event.data;
      if (type === "set-param") {
        this.bitcrusher.set_parameter(name, value);
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const input = inputs[0][0];
    const output = outputs[0][0];

    if (!input || !output) return true;

    // Copy JS input to WASM memory
    this.inputBuffer.set(input);

    // Call Rust/WASM process function
    this.bitcrusher.process(
      this.inputPtr,
      1, // num_input_channels
      this.outputPtr,
      1, // num_output_channels
      input.length
    );

    // Copy processed samples back to output
    output.set(this.outputBuffer);

    return true;
  }
}

registerProcessor("bitcrusher-processor", BitcrusherProcessor);
