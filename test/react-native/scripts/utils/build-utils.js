const { execFileSync } = require('child_process')
const { ROOT_DIR } = require('./constants')

/**
 * Builds packages if SKIP_BUILD_PACKAGES is not set
 */
function buildPackages () {
  if (process.env.SKIP_BUILD_PACKAGES) {
    return
  }

  // run npm ci in the root directory
  execFileSync('npm', ['ci', ['--no-audit']], { cwd: ROOT_DIR, stdio: 'inherit' })

  // build the packages
  const buildArgs = ['run', 'build']
  execFileSync('npm', buildArgs, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, ENABLE_TEST_CONFIGURATION: 1 }
  })
}

module.exports = {
  buildPackages
}
