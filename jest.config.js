/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  projects: [
    '<rootDir>/jest/config/angular.js',
    '<rootDir>/jest/config/browser.js',
    '<rootDir>/jest/config/core.js',
    '<rootDir>/jest/config/delivery-fetch.js',
    '<rootDir>/jest/config/react-native.js',
    '<rootDir>/jest/config/react-navigation.js',
    '<rootDir>/jest/config/react-router.js',
    '<rootDir>/jest/config/request-tracker.js',
    '<rootDir>/jest/config/vue-router.js'
  ],
  collectCoverageFrom: [
    '<rootDir>/packages/**/*.ts',
    '!<rootDir>/packages/**/*.d.ts',
    '!<rootDir>/packages/**/*.test.ts',
    '!<rootDir>/packages/**/tests/**/*',
    '!<rootDir>/examples/**/*',
    '!<rootDir>/packages/test-utilities/**/*',
    '!<rootDir>/test/**/*'
  ],
  coverageReporters: ['json-summary', 'text'],
  reporters: process.env.CI
    ? [['github-actions', { silent: false }], 'summary']
    : ['default']
}
