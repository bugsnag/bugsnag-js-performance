const { execFileSync } = require('child_process')
const { PACKAGE_NAMES, ROOT_DIR } = require('./constants')

/**
 * Builds packages if SKIP_BUILD_PACKAGES is not set
 */
function buildPackages () {
  if (process.env.SKIP_BUILD_PACKAGES) {
    return
  }

  // run npm install in the root directory
  execFileSync('npm', ['install'], { cwd: ROOT_DIR, stdio: 'inherit' })

  // build the packages
  const buildArgs = ['run', 'build', '--scope', PACKAGE_NAMES.join(' --scope ')]
  execFileSync('npm', buildArgs, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, ENABLE_TEST_CONFIGURATION: 1 }
  })
}

/**
 * Builds packages for Expo (uses npm ci instead of npm install)
 */
function buildPackagesForExpo () {
  if (process.env.SKIP_BUILD_PACKAGES) {
    return
  }

  // run npm ci in the root directory
  execFileSync('npm', ['ci', ['--no-audit']], { cwd: ROOT_DIR, stdio: 'inherit' })

  // build the packages
  const buildArgs = ['run', 'build', '--scope', PACKAGE_NAMES.join(' --scope ')]
  execFileSync('npm', buildArgs, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, ENABLE_TEST_CONFIGURATION: 1 }
  })
}

module.exports = {
  buildPackages,
  buildPackagesForExpo
}
