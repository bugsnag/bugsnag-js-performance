const path = require('path')

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['../../packages/core/lib/index.ts'],
  '@bugsnag/delivery-fetch-performance': ['../../packages/delivery-fetch/lib/delivery.ts'],
  '@bugsnag/react-native-performance': ['../../packages/platforms/react-native/lib/index.ts'],
  '@bugsnag/request-tracker-performance': ['../../packages/request-tracker/lib/index.ts']
}

const moduleNameMapper = {
  '^@bugsnag/core-performance$': path.join(__dirname, '../../packages/core/lib/index.ts'),
  '^@bugsnag/delivery-fetch-performance$': path.join(__dirname, '../../packages/delivery-fetch/lib/delivery.ts'),
  '^@bugsnag/react-native-performance$': path.join(__dirname, '../../packages/platforms/react-native/lib/index.ts'),
  '^@bugsnag/request-tracker-performance$': path.join(__dirname, '../../packages/request-tracker/lib/index.ts')
}

module.exports = {
  rootDir: '../../packages/react-navigation',
  preset: 'react-native',
  displayName: 'react-navigation',
  testMatch: [
    '<rootDir>/**/*.test.ts',
    '<rootDir>/**/*.test.tsx'
  ],
  moduleNameMapper,
  setupFilesAfterEnv: ['../../jest/setup/react-navigation.js'],
  transform: {
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: ['module:@react-native/babel-preset']
      }
    ],
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: { paths },
        babelConfig: {
          presets: ['module:@react-native/babel-preset']
        }
      }
    ]
  }
}
