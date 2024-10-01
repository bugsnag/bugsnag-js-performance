const path = require('path')

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['../../packages/core/lib/index.ts'],
  '@bugsnag/create-navigation-span': ['../../packages/create-navigation-span/lib/index.ts'],
  '@bugsnag/delivery-fetch-performance': ['../../packages/delivery-fetch/lib/delivery.ts'],
  '@bugsnag/react-native-performance': ['../../packages/platforms/react-native/lib/index.ts'],
  '@bugsnag/request-tracker-performance': ['../../packages/request-tracker/lib/index.ts']
}

// convert the tsconfig "paths" option into Jest's "moduleNameMapper" option
// e.g.: "{ 'path': ['./a/b'] }" -> "{ '^path$': ['<rootDir>/a/b'] }"
const internalModuleMap = Object.fromEntries(
  Object.entries(paths)
    .map(([name, directories]) => [
      `^${name}$`,
      directories.map(directory => path.join(__dirname, directory))
    ])
)

module.exports = {
  rootDir: '../../packages/plugin-react-native-navigation',
  preset: 'react-native',
  displayName: 'react-native-navigation',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx'
  ],
  moduleNameMapper: {
    ...internalModuleMap,
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: ['module:metro-react-native-babel-preset'],
        plugins: [
          ['@babel/plugin-transform-private-methods', {
            loose: true
          }]
        ]
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
