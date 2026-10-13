/**
 * Onset detection: finds where notes or hits begin in a mono signal, so a sample can be cut into slices.
 *
 * A classic script with no imports, so the very same file runs as a Web Worker (the app loads it with
 * `new Worker('/workers/onsets.js')`) and on the main thread (tests load it with a <script> tag and use
 * `EuclipOnsets`).
 *
 * How it works:
 *   1. analyze(): spectral flux. The signal is cut into overlapping windowed frames; for each frame the
 *      spectrum is taken and compressed with a log (so quiet and loud hits count alike); the flux is how
 *      much the spectrum grew since the previous frame, summed over frequency (only growth counts: a hit
 *      adds energy, a decay does not). The curve is scaled so its biggest peak is 1. This is the slow part.
 *   2. pick(): peak picking, which is cheap, so a sensitivity slider can re-run it on every change. A peak
 *      is an onset if it is a local maximum, at least `threshold` (a fraction of the biggest peak) and
 *      clearly above the flux around it, and not too close to a stronger one.
 *   3. Each peak is then moved back to where the attack actually starts in the waveform, because the
 *      spectrum only notices a hit once it fills a frame.
 */
(function (root) {
  'use strict';

  var FRAME = 1024; // samples per analysis frame (23 ms at 44.1 kHz)
  var HOP = 256; // samples between frames
  var MIN_GAP_SECONDS = 0.045; // two onsets closer than this are one
  var PEAK_RADIUS = 3; // a peak must beat its neighbours this many frames either side
  var CONTEXT_RADIUS = 20; // frames either side whose median flux a peak must clearly exceed
  var CONTEXT_FACTOR = 1.6;
  var COMPRESSION = 20; // log compression of the spectrum: higher makes quiet hits count more like loud ones
  var BLOCK = 64; // samples per block when locating the attack in the waveform
  var MIN_ABSOLUTE_FLUX = 8; // below this the signal has no real onsets (silence, a steady tone)
  var EDGE_SECONDS = 0.012; // an onset this close to the start or end of the file is the file's own edge

  // ---- FFT (radix 2, in place) ----

  function makeFft(size) {
    var levels = Math.log2(size);
    var reversed = new Uint32Array(size);
    for (var i = 0; i < size; i++) {
      var r = 0;
      for (var b = 0; b < levels; b++) r |= ((i >> b) & 1) << (levels - 1 - b);
      reversed[i] = r;
    }
    var cos = new Float64Array(size / 2);
    var sin = new Float64Array(size / 2);
    for (var k = 0; k < size / 2; k++) {
      cos[k] = Math.cos((2 * Math.PI * k) / size);
      sin[k] = Math.sin((2 * Math.PI * k) / size);
    }
    return function fft(re, im) {
      var n, j, tr, ti;
      for (n = 0; n < size; n++) {
        j = reversed[n];
        if (j > n) {
          tr = re[n]; re[n] = re[j]; re[j] = tr;
          ti = im[n]; im[n] = im[j]; im[j] = ti;
        }
      }
      for (var span = 2; span <= size; span *= 2) {
        var half = span / 2;
        var step = size / span;
        for (var start = 0; start < size; start += span) {
          for (var m = 0, t = 0; m < half; m++, t += step) {
            var a = start + m;
            var c = a + half;
            tr = re[c] * cos[t] + im[c] * sin[t];
            ti = -re[c] * sin[t] + im[c] * cos[t];
            re[c] = re[a] - tr; im[c] = im[a] - ti;
            re[a] += tr; im[a] += ti;
          }
        }
      }
    };
  }

  var fft = makeFft(FRAME);
  var hann = new Float64Array(FRAME);
  for (var w = 0; w < FRAME; w++) hann[w] = 0.5 - 0.5 * Math.cos((2 * Math.PI * w) / (FRAME - 1));

  // ---- step 1: the flux curve ----

  /**
   * @param {Float32Array} samples mono signal
   * @param {number} sampleRate
   * @returns {{ flux: Float32Array, samples: Float32Array, sampleRate: number, peak: number }}
   *   `flux` is scaled to a maximum of 1; `peak` is its unscaled maximum.
   */
  function analyze(samples, sampleRate) {
    var bins = FRAME / 2;
    var frames = Math.max(0, Math.floor((samples.length - FRAME) / HOP) + 1);
    var flux = new Float32Array(frames);
    var previous = new Float32Array(bins);
    var re = new Float64Array(FRAME);
    var im = new Float64Array(FRAME);

    for (var f = 0; f < frames; f++) {
      var offset = f * HOP;
      for (var i = 0; i < FRAME; i++) {
        re[i] = samples[offset + i] * hann[i];
        im[i] = 0;
      }
      fft(re, im);
      var sum = 0;
      for (var k = 0; k < bins; k++) {
        var level = Math.log(1 + COMPRESSION * Math.sqrt(re[k] * re[k] + im[k] * im[k]));
        var growth = level - previous[k];
        if (growth > 0 && f > 0) sum += growth; // the first frame has nothing before it to grow from
        previous[k] = level;
      }
      flux[f] = sum;
    }

    var peak = 0;
    for (var p = 0; p < frames; p++) if (flux[p] > peak) peak = flux[p];
    if (peak > 0) for (var q = 0; q < frames; q++) flux[q] /= peak;
    return { flux: flux, samples: samples, sampleRate: sampleRate, peak: peak };
  }

  // ---- step 2: picking peaks ----

  function median(values, from, to) {
    var slice = Array.prototype.slice.call(values, from, to + 1).sort(function (a, b) { return a - b; });
    return slice.length ? slice[Math.floor(slice.length / 2)] : 0;
  }

  // where the attack starts, within the frame the flux peaked at: the block whose energy rises the most.
  // (The spectrum only notices a hit once it is well inside the window, so the attack can be anywhere in
  // the frame, and a little after its start if the frame caught the tail of a hit.)
  function refine(samples, sampleRate, frameStart) {
    var from = Math.max(0, frameStart);
    var to = Math.min(samples.length - BLOCK, frameStart + FRAME + HOP);
    var blocks = Math.floor((to - from) / BLOCK);
    if (blocks < 2) return from / sampleRate;

    var best = 0;
    var bestRise = -Infinity;
    var previous = 0;
    for (var b = 0; b < blocks; b++) {
      var energy = 0;
      for (var i = 0; i < BLOCK; i++) {
        var s = samples[from + b * BLOCK + i];
        energy += s * s;
      }
      if (b > 0 && energy - previous > bestRise) {
        bestRise = energy - previous;
        best = b;
      }
      previous = energy;
    }
    return (from + best * BLOCK) / sampleRate;
  }

  /**
   * @param {object} analysis from analyze()
   * @param {number} threshold 0..1: how big a peak must be, as a fraction of the biggest one. Lower finds
   *   more (quieter) onsets.
   * @returns {number[]} onset times in seconds, ascending, not including the start or end of the file
   */
  function pick(analysis, threshold) {
    var flux = analysis.flux;
    var rate = analysis.sampleRate;
    var duration = analysis.samples.length / rate;
    if (!flux.length || analysis.peak < MIN_ABSOLUTE_FLUX) return [];

    var minGapFrames = Math.ceil((MIN_GAP_SECONDS * rate) / HOP);
    var peaks = [];

    for (var i = 1; i < flux.length - 1; i++) {
      var value = flux[i];
      if (value < threshold) continue;
      var isLocalMax = true;
      for (var d = 1; d <= PEAK_RADIUS && isLocalMax; d++) {
        if ((i - d >= 0 && flux[i - d] > value) || (i + d < flux.length && flux[i + d] >= value)) isLocalMax = false;
      }
      if (!isLocalMax) continue;
      var context = median(flux, Math.max(0, i - CONTEXT_RADIUS), Math.min(flux.length - 1, i + CONTEXT_RADIUS));
      if (value < context * CONTEXT_FACTOR + 0.02) continue;

      var last = peaks[peaks.length - 1];
      if (last && i - last.frame < minGapFrames) {
        if (value > last.value) peaks[peaks.length - 1] = { frame: i, value: value };
      } else {
        peaks.push({ frame: i, value: value });
      }
    }

    var times = peaks
      .map(function (peak) { return refine(analysis.samples, rate, peak.frame * HOP); })
      .filter(function (time) { return time > EDGE_SECONDS && time < duration - EDGE_SECONDS; });

    // refining can bring two together
    var spaced = [];
    times.forEach(function (time) {
      if (!spaced.length || time - spaced[spaced.length - 1] >= MIN_GAP_SECONDS) spaced.push(time);
    });
    return spaced;
  }

  function detect(samples, sampleRate, threshold) {
    return pick(analyze(samples, sampleRate), threshold);
  }

  var api = { analyze: analyze, pick: pick, detect: detect, FRAME: FRAME, HOP: HOP };
  root.EuclipOnsets = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  // ---- as a worker ----
  //   -> { type: 'analyze', request, id, samples (transferred), sampleRate, threshold }   <- { request, id, onsets }
  //   -> { type: 'pick', request, id, threshold }                                         <- { request, id, onsets }
  //   -> { type: 'forget', id }
  // (`request` is echoed so the caller can match a reply to its question; an error reply has `error`.)
  // The flux curve and signal are kept per id, so moving a sensitivity slider only re-runs pick().
  if (typeof WorkerGlobalScope !== 'undefined' && root instanceof WorkerGlobalScope) {
    var analyses = {};
    root.onmessage = function (event) {
      var message = event.data;
      try {
        if (message.type === 'analyze') {
          analyses[message.id] = analyze(message.samples, message.sampleRate);
        } else if (message.type === 'forget') {
          delete analyses[message.id];
          return;
        }
        var analysis = analyses[message.id];
        if (!analysis) throw new Error('nothing analysed for ' + message.id);
        root.postMessage({ request: message.request, id: message.id, onsets: pick(analysis, message.threshold) });
      } catch (error) {
        root.postMessage({ request: message.request, id: message.id, error: String((error && error.message) || error) });
      }
    };
  }
})(typeof self !== 'undefined' ? self : this);
