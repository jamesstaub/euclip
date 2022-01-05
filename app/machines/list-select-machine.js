import { createMachine } from "xstate";

export default createMachine({
  initial: "idle",
  states: {
    idle: {
      on: {
        SELECT: {
          target: "selected",
        },
      },
    },
    selected: {
      entry: ["handleSelectItem"],
      on: {
        SELECT: "selected",
        SUBMIT: "submitted",
      },
    },
    submitted: {
      entry: ["handleSubmit"],
      on: {
        LOADING: "loading",
      },
    },
    loading: {
      on: {
        SUCCESS: "success",
        ERROR: "error",
      },
    },
    success: {
      entry: ["handleSuccess"],
      type: 'final'
    },
    error: {},
  },
});
