import { Factory } from 'ember-cli-mirage';

const init = `
__()
  .sampler({
    id: this.id,
    path: this.filepath,
    ui: 'multislider',
  })
  .gain({
    ui: 'multislider',
  })
  .channelStrip()
  .connect('#mixer')
`;

const adsr = `
__("sine").remove();
for (var i = 0; i < 8; i++) {
  __().sine({id: "sin-" + i}).adsr(.53).connect('#mixer');
}


__("sine").play()

if (data) {
  this.playSample(index);
} else {
  __("adsr").adsr("trigger", [0.025, 0.0015, 0.07, 1]);
  var note = __.random_scale('minor', 3, 6);
  __("#sin-"+i).attr({ frequency: note } )
}

`
export default Factory.extend({
  safeCode: i => init,
  editorContent: i => init,
 });
