const path = require('path')

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['../../packages/core/lib/index.ts'],
  '@bugsnag/react-native-performance': ['../../packages/platforms/react-native/lib/index.ts']
}

// convert the tsconfig "paths" option into Jest's "moduleNameMapper" option
// e.g.: "{ 'path': ['./a/b'] }" -> "{ '^path$': ['<rootDir>/a/b'] }"
const moduleNameMapper = Object.fromEntries(
  Object.entries(paths)
    .map(([name, directories]) => [
      `^${name}$`,
      directories.map(directory => path.join(__dirname, directory))
    ])
)

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
        presets: ['module:metro-react-native-babel-preset']
      }
    ],
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: { paths },
        babelConfig: {
          presets: ['module:metro-react-native-babel-preset']
        }
      }
    ]
  }
}
