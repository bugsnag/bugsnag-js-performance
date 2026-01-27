/**
 * Validates that required environment variables are set
 * @param {Object} config - Object mapping env var names to configuration objects
 *   Each config can have: { message: string, validator?: function }
 */
function validateEnvironment (config) {
  for (const [envVar, envConfig] of Object.entries(config)) {
    const value = process.env[envVar]
    
    // Check if environment variable is set
    if (!value) {
      console.error(envConfig.message || `${envVar} is required`)
      process.exit(1)
    }
    
    // Run additional validation if provided
    if (envConfig.validate && !envConfig.validate(value)) {
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
