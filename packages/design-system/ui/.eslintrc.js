module.exports = {
  root: false, // Extend from root config
  extends: [
    "../../../.eslintrc.js", // Inherit root config
    "plugin:storybook/recommended", // Add storybook rules only for this package
  ],
}
