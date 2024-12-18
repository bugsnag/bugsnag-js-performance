/** @type {import('ts-jest').JestConfigWithTsJest} */

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['./packages/core/lib/index.ts'],
  '@bugsnag/browser-performance': ['./packages/platforms/browser/lib/index.ts'],
  '@bugsnag/delivery-fetch-performance': ['./packages/delivery-fetch/lib/delivery.ts'],
  '@bugsnag/request-tracker-performance': ['./packages/request-tracker/lib/index.ts'],
  '@bugsnag/react-router-performance': ['./packages/react-router/lib/index.ts'],
  '@bugsnag/vue-router-performance': ['./packages/vue-router/lib/index.ts'],
  '@bugsnag/angular-performance': ['./packages/angular/lib/index.ts'],
  '@bugsnag/plugin-react-native-navigation-performance': ['./packages/plugin-react-native-navigation/lib/index.ts'],
  '@bugsnag/plugin-react-navigation-performance': ['./packages/plugin-react-navigation/lib/index.ts']
}

// convert the tsconfig "paths" option into Jest's "moduleNameMapper" option
// e.g.: "{ 'path': ['./a/b'] }" -> "{ '^path$': ['<rootDir>/a/b'] }"
const moduleNameMapper = Object.fromEntries(
  Object.entries(paths)
    .map(([name, directories]) => [
          `^${name}$`,
          directories.map(directory => directory.replace('./', '<rootDir>/'))
    ])
)

const defaultModuleConfig = {
  preset: 'ts-jest/presets/js-with-ts',
  moduleNameMapper,
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      { tsconfig: { paths, allowJs: true } }
    ]
  }
}

module.exports = {
  projects: [
    {
      displayName: 'core',
      testMatch: ['<rootDir>/packages/core/**/*.test.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'delivery-fetch',
      testMatch: ['<rootDir>/packages/delivery-fetch/**/*.test.ts'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest/setup/crypto.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'browser',
      testMatch: ['<rootDir>/packages/platforms/browser/**/*.test.ts'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest/setup/crypto.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'request-tracker',
      testMatch: ['<rootDir>/packages/request-tracker/**/*.test.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'vue-router',
      testMatch: ['<rootDir>/packages/vue-router/**/*.test.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'react-router',
      testMatch: ['<rootDir>/packages/react-router/**/*.test.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'angular',
      preset: 'jest-preset-angular',
      setupFilesAfterEnv: ['<rootDir>/jest/setup/angular.ts'],
      testMatch: ['<rootDir>/packages/angular/**/*.test.ts'],
      ...defaultModuleConfig,
      transformIgnorePatterns: ['/node_modules/(?!(@angular)/)']
    },
    {
      displayName: 'react-native',
      preset: 'react-native',
      testMatch: ['<rootDir>/packages/platforms/react-native/tests/**/*.test.ts'],
      coveragePathIgnorePatterns: ['<rootDir>/packages/core', '<rootDir>/packages/platforms/browser', '<rootDir>/packages/delivery-fetch'],
      moduleNameMapper,
      transform: {
        '^.+\\.jsx?$': [
          'babel-jest',
          {
            presets: ['module:metro-react-native-babel-preset']
          }
        ],
        '^.+\\.m?tsx?$': [
          'ts-jest',
          {
            tsconfig: { paths },
            babelConfig: {
              presets: ['module:metro-react-native-babel-preset']
            }
          }
        ]
      }
    },
    '<rootDir>/jest/config/react-navigation.js',
    '<rootDir>/jest/config/react-native-navigation.js'
  ],
  collectCoverageFrom: [
    '**/packages/*/**/*.ts',
    '!**/packages/*/**/*.d.ts',
    '!**/packages/*/**/*.test.ts',
    '!**/packages/*/**/tests/**/*',
    '!**/packages/*/**/__tests__/**/*',
    '!<rootDir>/packages/test-utilities/**/*',
    '!<rootDir>/test/**/*'
  ],
  coverageReporters: ['json-summary', 'text'],
  reporters: process.env.CI
    ? [['github-actions', { silent: false }], 'summary']
    : ['default']
}
