const paths = require('./paths')

// convert the tsconfig "paths" option into Jest's "moduleNameMapper" option
// e.g.: "{ 'path': ['../../a/b'] }" -> "{ '^path$': ['<rootDir>/a/b'] }"
const moduleNameMapper = Object.fromEntries(
  Object.entries(paths)
    .map(([name, directories]) => [
            `^${name}$`,
            directories.map(directory => directory.replace('../../', '<rootDir>/'))
    ])
)

module.exports = moduleNameMapper
