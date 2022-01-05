import { createMachine } from "xstate";

const guiCanCreate = (context, event) => {
  console.log('can create GUI', context, event);
  return true;
};

export default createMachine({
  initial: "script",
  context: {
    selectedTab: '',
  },
  states: {
    signalGui: {
      on: {
        CREATE_FROM_GUI: {
          target: "script.init",
          cond: guiCanCreate
        },
        BACK_TO_SCRIPT: "script",

      },
      states: {}
    },
    script: {
      initial: "init",
      on: {
        OPEN_GUI: "signalGui",
        OPEN_PRESETS: "presets",
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
    presets: {
      initial: "beforeSelection",
      on: {
        BACK_TO_SCRIPT: "script",
        SUBMIT: "presets.submitting",
      },
      states: {
        beforeSelection: {},
        hasSelection: {},
        submitting: {},
        error: {},
      }
    }
  },
});
