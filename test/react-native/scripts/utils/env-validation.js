/**
 * Validates that required environment variables are set
 * @param {Object} requirements - Object mapping env var names to error messages
 * @param {Object} additionalValidators - Object mapping env var names to validation functions
 */
function validateEnvironment (requirements, additionalValidators = {}) {
  for (const [envVar, errorMessage] of Object.entries(requirements)) {
    if (!process.env[envVar]) {
      console.error(errorMessage)
      process.exit(1)
    }
  }

  for (const [envVar, validator] of Object.entries(additionalValidators)) {
    if (!validator(process.env[envVar])) {
      console.error(`Invalid value for ${envVar}`)
      process.exit(1)
    }
  }
}

/**
 * Checks if environment variable is truthy (true or 1)
 */
function isTruthy (value) {
  return value === 'true' || value === '1'
}

/**
 * Checks if environment variable is a boolean string (1 or 0)
 */
function isBooleanString (value) {
  return value === '1' || value === '0'
}

module.exports = {
  validateEnvironment,
  isTruthy,
  isBooleanString
}
