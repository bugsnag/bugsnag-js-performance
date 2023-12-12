// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['../core/lib/index.ts'],
  '@bugsnag/react-native-performance': ['../platforms/react-native/lib/index.ts']
}

// convert the tsconfig "paths" option into Jest's "moduleNameMapper" option
// e.g.: "{ 'path': ['../../a/b'] }" -> "{ '^path$': ['<rootDir>/a/b'] }"
const moduleNameMapper = Object.fromEntries(
  Object.entries(paths)
    .map(([name, directories]) => [
            `^${name}$`,
            directories.map(directory => directory.replace('../', '<rootDir>/'))
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
