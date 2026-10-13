import ENV from 'euclip/config/environment';

/**
 * Onset detection for decoded samples. The algorithm lives in public/workers/onsets.js (a plain script, so
 * the same file is a Web Worker here and can be loaded on the main thread by tests); this wraps it.
 *
 * Analysing a sample (the slow part) happens once; moving the sensitivity then only re-picks peaks, which is
 * quick, so `pick` can run on every slider change.
 */

export interface OnsetAnalysisOptions {
  /** an identifier for the sample (its path); `pick` and `forget` refer to it */
  id: string;
  samples: Float32Array;
  sampleRate: number;
  threshold: number;
}

type Detector = {
  analyze(samples: Float32Array, sampleRate: number): unknown;
  pick(analysis: unknown, threshold: number): number[];
};

const SCRIPT_URL = `${ENV.rootURL ?? '/'}workers/onsets.js`;

/** The channels of a buffer mixed down to one, as the detector expects. */
export function mixToMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length;
  const mono = new Float32Array(length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) mono[i] += data[i] / buffer.numberOfChannels;
  }
  return mono;
}

export class OnsetEngine {
  private worker?: Worker;
  private workerFailed = false;
  private requests = new Map<number, { resolve: (onsets: number[]) => void; reject: (error: Error) => void }>();
  private nextRequest = 0;

  // the main-thread fallback: the same script, loaded with a <script> tag, with analyses kept here
  private detector?: Promise<Detector>;
  private analyses = new Map<string, unknown>();

  private getWorker(): Worker | undefined {
    if (this.worker || this.workerFailed || typeof Worker === 'undefined') return this.worker;
    try {
      this.worker = new Worker(SCRIPT_URL);
      this.worker.onmessage = ({ data }) => {
        const request = this.requests.get(data.request);
        if (!request) return;
        this.requests.delete(data.request);
        if (data.error) request.reject(new Error(data.error));
        else request.resolve(data.onsets);
      };
      this.worker.onerror = () => {
        // no usable worker (blocked, or the script is missing): do the work on the main thread from now on
        this.workerFailed = true;
        this.worker = undefined;
        this.requests.forEach((request) => request.reject(new Error('onset worker failed')));
        this.requests.clear();
      };
    } catch {
      this.workerFailed = true;
    }
    return this.worker;
  }

  private loadDetector(): Promise<Detector> {
    this.detector ??= new Promise((resolve, reject) => {
      const existing = (window as any).EuclipOnsets;
      if (existing) return resolve(existing);
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.onload = () => resolve((window as any).EuclipOnsets);
      script.onerror = () => reject(new Error(`could not load ${SCRIPT_URL}`));
      document.head.appendChild(script);
    });
    return this.detector;
  }

  private ask(message: Record<string, unknown>, transfer: Transferable[] = []): Promise<number[]> | undefined {
    const worker = this.getWorker();
    if (!worker) return undefined;
    return new Promise((resolve, reject) => {
      const request = this.nextRequest++;
      this.requests.set(request, { resolve, reject });
      worker.postMessage({ ...message, request }, transfer);
    });
  }

  /** Analyses a sample and returns its onsets (seconds). The samples are handed to the worker, not copied. */
  async analyze({ id, samples, sampleRate, threshold }: OnsetAnalysisOptions): Promise<number[]> {
    const viaWorker = this.ask({ type: 'analyze', id, samples, sampleRate, threshold }, [samples.buffer]);
    if (viaWorker) {
      try {
        return await viaWorker;
      } catch (error) {
        if (!this.workerFailed) throw error;
        // fall through to the main thread; `samples` was transferred away, so the caller must retry with its own copy
        throw new Error('onset worker unavailable');
      }
    }
    const detector = await this.loadDetector();
    this.analyses.set(id, detector.analyze(samples, sampleRate));
    return detector.pick(this.analyses.get(id), threshold);
  }

  /** The onsets of an already analysed sample for another threshold. */
  async pick(id: string, threshold: number): Promise<number[]> {
    const viaWorker = this.ask({ type: 'pick', id, threshold });
    if (viaWorker) return viaWorker;
    const detector = await this.loadDetector();
    const analysis = this.analyses.get(id);
    if (!analysis) throw new Error(`nothing analysed for ${id}`);
    return detector.pick(analysis, threshold);
  }

  forget(id: string): void {
    this.worker?.postMessage({ type: 'forget', id });
    this.analyses.delete(id);
  }
}
