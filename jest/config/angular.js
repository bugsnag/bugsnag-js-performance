const baseConfig = require('./base')

module.exports = {
  ...baseConfig,
  displayName: 'angular',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/jest/setup/angular.ts'],
  testMatch: ['<rootDir>/packages/angular/**/*.test.ts'],
  transformIgnorePatterns: ['/node_modules/(?!(@angular)/)']
}
