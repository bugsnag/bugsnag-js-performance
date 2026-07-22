/** @type {import('ts-jest').JestConfigWithTsJest} */

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['./packages/core/lib/index.ts'],
  '@bugsnag/browser-performance': ['./packages/platforms/browser/lib/index.ts'],
  '@bugsnag/delivery-fetch-performance': ['./packages/delivery-fetch/lib/delivery.ts'],
  '@bugsnag/react-native-performance': ['./packages/platforms/react-native/lib/index.ts'],
  '@bugsnag/request-tracker-performance': ['./packages/request-tracker/lib/index.ts'],
  '@bugsnag/react-router-performance': ['./packages/react-router/lib/index.ts'],
  '@bugsnag/vue-router-performance': ['./packages/vue-router/lib/index.ts'],
  '@bugsnag/angular-performance': ['./packages/angular/lib/index.ts'],
  '@bugsnag/plugin-react-native-navigation-performance': ['./packages/plugin-react-native-navigation/lib/index.ts'],
  '@bugsnag/plugin-react-navigation-performance': ['./packages/plugin-react-navigation/lib/index.ts'],
  '@bugsnag/plugin-react-performance': ['./packages/plugin-react-performance/lib/index.ts'],
  '@bugsnag/plugin-named-spans-performance': ['./packages/plugin-named-spans/lib/index.ts'],
  '@bugsnag/plugin-react-native-span-access': ['./packages/plugin-react-native-span-access/lib/index.ts']
}

// convert tsconfig paths → jest moduleNameMapper
const moduleNameMapper = Object.fromEntries(
  Object.entries(paths).map(([name, directories]) => [
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
      {
        tsconfig: { paths, allowJs: true }
      }
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
      ...defaultModuleConfig
    },
    {
      displayName: 'browser',
      testMatch: ['<rootDir>/packages/platforms/browser/**/*.test.ts'],
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
      displayName: 'svelte-kit',
      testMatch: ['<rootDir>/packages/svelte-kit/**/*.test.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'plugin-react-performance',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest/setup/react.ts'],
      testMatch: ['<rootDir>/packages/plugin-react-performance/**/*.test.tsx'],
      moduleNameMapper,
      transform: {
        '^.+\\.jsx?$': [
          'babel-jest',
          {
            presets: ['@babel/preset-react']
          }
        ],
        '^.+\\.m?tsx?$': [
          'ts-jest',
          {
            tsconfig: { paths },
            babelConfig: {
              presets: ['@babel/preset-react']
            }
          }
        ]
      }
    },
    {
      displayName: 'angular',
      preset: 'jest-preset-angular',
      testMatch: ['<rootDir>/packages/angular/**/*.test.ts'],
      ...defaultModuleConfig,
      transformIgnorePatterns: ['/node_modules/(?!(@angular)/)']
    },
    {
      displayName: 'react-native',
      preset: 'react-native',
      setupFilesAfterEnv: ['<rootDir>/jest/setup/react-native.ts'],
      testMatch: ['<rootDir>/packages/platforms/react-native/tests/**/*.test.ts'],
      coveragePathIgnorePatterns: [
        '<rootDir>/packages/core',
        '<rootDir>/packages/platforms/browser',
        '<rootDir>/packages/delivery-fetch'
      ],
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
    {
      displayName: 'plugin-named-spans',
      testMatch: ['<rootDir>/packages/plugin-named-spans/**/*.test.ts'],
      ...defaultModuleConfig
    },
    {
      displayName: 'plugin-react-native-span-access',
      preset: 'react-native',
      testMatch: [
        '<rootDir>/packages/plugin-react-native-span-access/tests/**/*.test.ts'
      ],
      coveragePathIgnorePatterns: ['<rootDir>/packages/core'],
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
    {
      displayName: 'react-navigation',
      preset: 'react-native',
      setupFilesAfterEnv: [
        '<rootDir>/jest/setup/react-native.ts',
        '<rootDir>/jest/setup/react-navigation.ts'
      ],
      testMatch: [
        '<rootDir>/packages/plugin-react-navigation/**/*.test.ts'
      ],
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
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-screens)/)'
      ]
    },
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
