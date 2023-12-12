const baseConfig = require('./base')

module.exports = {
  ...baseConfig,
  displayName: 'browser',
  testMatch: ['<rootDir>/packages/platforms/browser/**/*.test.ts']
}
