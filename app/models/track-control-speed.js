import TrackControlModel from './track-control';

export default class TrackControlSpeedModel extends TrackControlModel {

  constructor() {
    super(...arguments);
    console.log('TrackControlSpeedModel');
    this.nodeAttr = 'speed';
    this.min = 0.125;
    this.max = 2;
    this.stepSize = 0.0125;
    this.defaultValue = 1;
    this.interfaceName = 'slider';
  }
}
