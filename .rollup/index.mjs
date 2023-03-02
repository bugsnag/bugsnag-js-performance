import typescript from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'
import fs from 'fs'

function createRollupConfig () {
  const packageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`))

  return {
    input: 'lib/index.ts',
    output: {
      dir: 'dist',
      format: 'esm',
      preserveModules: true,
      generatedCode: {
        preset: 'es2015',
      },
    },
    external: ['@bugsnag/js-performance-core'],
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          __VERSION__: packageJson.version,
        },
      }),
      typescript({
        // don't output anything if there's a TS error
        noEmitOnError: true,
        // turn on declaration files and declaration maps
        compilerOptions: {
          declaration: true,
          declarationMap: true,
          emitDeclarationOnly: true,
          declarationDir: 'dist/types',
        },
      }),
    ],
  }
}

export default createRollupConfig
