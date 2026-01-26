const baseConfig = require("../../medusa-config.js")

baseConfig.modules = {
  ...baseConfig.modules,
  custom: {
    resolve: "src/modules/custom",
  },
}
module.exports = baseConfig
