module.exports = {
  displayName: 'operations-remote',
  rootDir: '.',
  testEnvironment: 'jsdom',
  transform: { '^.+\\.tsx?$': 'babel-jest' },
  moduleNameMapper: { '\\.(css|less|scss)$': 'identity-obj-proxy' },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx']
};
