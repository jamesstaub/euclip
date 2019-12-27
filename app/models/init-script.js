import ScriptModel from './script';

const supportedNodes = ['gain','sampler','lowpass','highpass','bandpass','allpasss','notch','lowshelf','highshelf','peaking','reverb','delay','bitcrusher','overdrive','ring','comb'];

export default class InitScriptModel extends ScriptModel {
  newFunction() {
    return new Function(this.code).bind(this.track.get('scriptScope'));
  }

  
  storeNewAudioNodes() {

    /**
     *  
     query the audio-context to identify newly created audio nodes
     after running init-script
    const codeToParse = this.code.replace(/(\r\n|\n|\r|\s)/gm, '');
    codeToParse.match(/(?<=\.)(.*?)(?=\()/g)
      .map((node) => node.split(').').lastObject) // FIXME/Remove the result of nodesFound sometimes contains more than the node name
      .filter((node) => supportedNodes.indexOf(node) > -1) // find audio node definitions eligible for track-controls
      .flatMap((nodeType) => __.find(nodeType)) // cracked.find returns an array of matches
      .uniq() // remove duplicates
      .filter((uuid) => this.get('track.audioNodeUUIDs').indexOf(uuid) === -1) // remove uuids already saved to track
      .forEach((uuid) => this.get('track.audioNodeUUIDs').push(uuid)) // remaining are uuids of newly created audio nodes
     * 
     */
  }
}
