# Testing the BugsnagPerformance JS client

## Initial setup

Clone and navigate to this repo:

```sh
git clone git@github.com:bugsnag/bugsnag-js-performance.git
cd bugsnag-js-performance
```

Install top level dependencies:

```sh
npm install
```

Build each of the standalone packages:

```sh
npm run build
```

## Unit tests

Runs the unit tests for each package.

```sh
npm run test:unit
```

## Type tests

This tests the validity of .d.ts files by attempting to compile a TypeScript program that uses Bugsnag.

```sh
npm run test:types
```

## Linting

Lints the entire repo with ESLint. On JavaScript files this uses the [standard](https://github.com/standard/eslint-config-standard) ruleset and on TypeScript files this uses the [@typescript/eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) recommended set of rules.

```sh
npm run test:lint
```

## End to end

These tests are implemented with our notifier testing tool [Maze runner](https://github.com/bugsnag/maze-runner).

End to end tests are written in cucumber-style `.feature` files, and need Ruby-backed "steps" in order to know what to run. The tests are located in the top level [`test`](/test/) directory.
