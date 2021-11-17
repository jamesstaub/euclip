import { Machine } from "xstate";

export default Machine({
  initial: "signalGui",
  context: {
    selectedTab: '',
  },
  states: {
    signalGui: {
      on: {
        TOGGLE_INPUT_UI: "script.init",
        CREATE: "script.init",
      },
      states: {
        
      }
    },
    script: {
      initial: "init",
      on: {
        TOGGLE_INPUT_UI: "signalGui",
        SET_TAB_INIT: 'script.init',
        SET_TAB_ONSTEP: 'script.onstep',
      },
      states: {
        init: {
        },
        onstep: {
        },
      },
    },
  },
});
