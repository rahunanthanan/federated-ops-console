/** Root Jest config covering unit/contract/component tests across the workspace. */
module.exports = {
  projects: [
    '<rootDir>/apps/operations-remote/jest.config.js',
    '<rootDir>/packages/platform-http/jest.config.js',
    '<rootDir>/packages/platform-events/jest.config.js'
  ]
};
