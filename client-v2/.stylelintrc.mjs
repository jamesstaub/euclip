export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // class names are BEM (block__element--modifier), as in the v1 layout styles
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      {
        message: (selector) =>
          `Expected class selector "${selector}" to be BEM (block__element--modifier, each part kebab-case)`,
      },
    ],
  },
};
