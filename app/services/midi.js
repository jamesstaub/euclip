import Service from '@ember/service';

export default class MidiService extends Service {

  initMidi() {
    __.midi_init(function(){
      __.midi_receive(function(midiEvent){
        debugger
        this.onMidiClock();
        //handle incoming raw midi events here...
      });
    });
  }
}
