const fs = require('fs')

/**
 * Safely removes a directory if it exists
 */
function cleanDirectory (dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

/**
 * Creates directory recursively if it doesn't exist
 */
function ensureDirectory (dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * Replaces content in a file using regex
 */
function replaceInFile (filePath, searchPattern, replacement) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  let content = fs.readFileSync(filePath, 'utf8')
  content = content.replace(searchPattern, replacement)
  fs.writeFileSync(filePath, content)
}

/**
 * Appends content to a file if it doesn't already contain it
 */
function appendToFileIfNotExists (filePath, content, checkString) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  let fileContent = fs.readFileSync(filePath, 'utf8')
  if (!fileContent.includes(checkString)) {
    fileContent += `\n${content}`
    fs.writeFileSync(filePath, fileContent)
  }
}

/**
 * Copies file with error handling
 */
function safeCopyFile (src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source file not found: ${src}`)
  }
  fs.copyFileSync(src, dest)
}

/**
 * Removes file if it exists
 */
function removeFileIfExists (filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

module.exports = {
  cleanDirectory,
  ensureDirectory,
  replaceInFile,
  appendToFileIfNotExists,
  safeCopyFile,
  removeFileIfExists
}
