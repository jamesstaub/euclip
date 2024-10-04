import Model, { attr, belongsTo } from '@ember-data/model';

// holds a filepath string value to pass to sampler (or convolution) nodes
export default class FilepathControlModel extends Model {
  @belongsTo('track', { async: false, inverse: 'filepathControls' }) track;
  @belongsTo('trackNode', { async: false, inverse: 'filepathControls' })
  trackNode;
  @attr('number') nodeOrder;
  @attr('string') controlValue; // value of control for string attributes

  get pathSegments() {
    if (this.controlValue) {
      return this.controlValue.replace(/%20/g, ' ').split('/');
    }
    return [];
  }

  get filename() {
    if (this.pathSegments?.length) {
      return this.pathSegments[this.pathSegments.length - 1].split('.')[0];
    }
    return '';
  }

  // explicitly does not call save  to allow saving after restarting audio
  static findOrCreateWith({ track, trackNode, controlValue }) {
    // peek for existing filepath contorl matching trackNode.order with this node order
    let filepathControl = track.filepathControls.find(
      (control) =>
        control.orderOfType != undefined &&
        control.orderOfType === trackNode.orderOfType
    );

    if (filepathControl && controlValue) {
      filepathControl.controlValue = controlValue;
    }

    if (!filepathControl) {
      try {
        filepathControl = track.store.createRecord('filepath-control', {
          trackNode,
          track,
          nodeOrder: trackNode.orderOfType || 0,
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
