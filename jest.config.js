/** @type {import('ts-jest').JestConfigWithTsJest} */

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['./packages/core/lib/index.ts'],
  '@bugsnag/browser-performance': ['./packages/platforms/browser/lib/index.ts']
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

const baseModules = [
  {
    displayName: 'core',
    path: '<rootDir>/packages/core'
  },
  {
    displayName: 'browser',
    path: '<rootDir>/packages/platforms/browser'
  },
  {
    displayName: 'delivery-fetch',
    path: '<rootDir>/packages/delivery-fetch'
  }
]

module.exports = {
  projects: [
    ...baseModules.map(({ displayName, path }) => ({
      displayName,
      testMatch: [`${path}/**/*.test.ts`],
      preset: 'ts-jest/presets/js-with-ts',
      moduleNameMapper,
      transform: {
        '^.+\\.m?[tj]sx?$': [
          'ts-jest',
          { tsconfig: { paths } }
        ]
      }
    })),
    {
      displayName: 'react-native',
      preset: 'react-native',
      testMatch: ['<rootDir>/packages/platforms/react-native/**/*.test.ts'],
      coveragePathIgnorePatterns: baseModules.map(({ path }) => path), // prevent other modules from being transformed again
      moduleNameMapper,
      transform: {
        '^.+\\.m?[tj]sx?$': [
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
  ],
  collectCoverageFrom: [
    '**/packages/*/**/*.ts',
    '!**/packages/*/**/*.d.ts',
    '!**/packages/*/**/*.test.ts',
    '!**/packages/*/**/tests/**/*',
    '!<rootDir>/packages/test-utilities/**/*',
    '!<rootDir>/test/**/*'
  ],
  coverageReporters: ['json-summary', 'text'],
  reporters: process.env.CI
    ? [['github-actions', { silent: false }], 'summary']
    : ['default']
}
