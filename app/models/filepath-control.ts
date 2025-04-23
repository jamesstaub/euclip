import Model, { attr, belongsTo } from '@ember-data/model';


// holds a filepath string value to pass to sampler (or convolution) nodes
export default class FilepathControlModel extends Model {
  @belongsTo('track', { async: false, inverse: 'filepathControls' }) track!: any;
  @belongsTo('track-node', { async: false, inverse: 'filepathControls' }) trackNode!: any;
  @attr('number') nodeOrder!: number;
  @attr('string') controlValue!: string; // value of control for string attributes

  get pathSegments(): string[] {
    if (this.controlValue) {
      return this.controlValue.replace(/%20/g, ' ').split('/');
    }
    return [];
  }

  get filename(): string | undefined {
    if (this.pathSegments?.length) {
      return this.pathSegments[this.pathSegments.length - 1]?.split('.')[0];
    }
    return '';
  }

  // explicitly does not call save to allow saving after restarting audio
  static findOrCreateWith({
    track,
    trackNode,
    controlValue,
  }: {
    track: any;
    trackNode: any;
    controlValue: string;
  }): FilepathControlModel | undefined {
    // peek for existing filepath control matching trackNode.order with this node order
    let filepathControl = track.filepathControls.find(
      (control: FilepathControlModel) =>
        control.nodeOrder !== undefined &&
        control.nodeOrder === trackNode.nodeOrder
    );

    if (filepathControl && controlValue) {
      filepathControl.controlValue = controlValue;
    }

    if (!filepathControl) {
      try {
        filepathControl = track.store.createRecord('filepath-control', {
          trackNode,
          track,
          nodeOrder: trackNode.nodeOrder || 0,
          controlValue,
        });
        track.filepathControls.pushObject(filepathControl);
      } catch (error) {
        console.error('Error creating default filepath control: ', error);
      }
    }

    return filepathControl;
  }
}
