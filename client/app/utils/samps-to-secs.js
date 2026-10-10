export default function sampsToSecs(buffer) {
  return buffer.length / buffer.sampleRate;
}
