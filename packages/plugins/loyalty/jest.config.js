const { loadEnv } = require("@medusajs/framework/utils");

const environment = process.env.NODE_ENV || "development";

loadEnv(environment, process.cwd());

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  rootDir: "./",
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            decorators: true,
          },
          transform: {
            useDefineForClassFields: false,
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: "ES2021",
        },
        sourceMaps: "inline",
      },
    ],
  },
  modulePathIgnorePatterns: [`dist/`],
  testPathIgnorePatterns: [`dist/`, `node_modules/`],
  transformIgnorePatterns: ["node_modules/"],
  testEnvironment: `node`,
  moduleFileExtensions: [`js`, `ts`],
  setupFiles: ["./integration-tests/setup.js"],
  // testPathIgnorePatterns: [
  //   `/dist/`,
  //   `/node_modules/`,
  //   `<rootDir>/node_modules/`,
  //   `__tests__/fixtures`,
  //   "__fixtures__",
  //   "utils",
  //   ".medusa/",
  // ],
};
