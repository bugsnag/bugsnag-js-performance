// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/angular-performance': ['../../packages/angular/lib/index.ts'],
  '@bugsnag/browser-performance': ['../../packages/platforms/browser/lib/index.ts'],
  '@bugsnag/core-performance': ['../../packages/core/lib/index.ts'],
  '@bugsnag/react-native-performance': ['../../packages/platfortms/react-native/lib/index.ts'],
  '@bugsnag/delivery-fetch-performance': ['../../packages/delivery-fetch/lib/delivery.ts'],
  '@bugsnag/react-router-performance': ['../../packages/react-router/lib/index.ts'],
  '@bugsnag/request-tracker-performance': ['../../packages/request-tracker/lib/index.ts'],
  '@bugsnag/vue-router-performance': ['../../packages/vue-router/lib/index.ts']
}

module.exports = paths
