import { Machine } from "xstate";

const guiCanCreate = (context, event) => {
  console.log(context, event);
  return true;
};

export default Machine({
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
        CANCEL_GUI: "script",

      },
      states: {
        
      }
    },
    script: {
      initial: "init",
      on: {
        OPEN_GUI: "signalGui",
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
