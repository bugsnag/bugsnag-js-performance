/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.matchers.ts', '<rootDir>/.jest/setEnvVars.ts'],
  reporters: process.env.CI
    ? [['github-actions', { silent: false }], 'summary']
    : ['default']
}
