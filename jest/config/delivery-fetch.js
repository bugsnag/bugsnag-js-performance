const baseConfig = require('./base')

module.exports = {
  ...baseConfig,
  displayName: 'delivery-fetch',
  testMatch: ['<rootDir>/packages/delivery-fetch/**/*.test.ts']
}
