const moduleNameMapper = require('./module-name-mapper')
const paths = require('./paths')

module.exports = {
  rootDir: '../../',
  preset: 'ts-jest/presets/js-with-ts',
  moduleNameMapper,
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      { tsconfig: { paths, allowJs: true } }
    ]
  }
}
