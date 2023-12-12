const baseConfig = require('./base')

module.exports = {
  ...baseConfig,
  displayName: 'request-tracker',
  testMatch: ['<rootDir>/packages/request-tracker/**/*.test.ts']
}
