import { registerMacroOverrides } from 'euclip/utils/macros/cracked-overrides';

export default {
  name: 'macros',
  initialize() {
    registerMacroOverrides();
  },
};
