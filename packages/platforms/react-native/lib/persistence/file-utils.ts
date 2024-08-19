/**
 * MIT License
 *
 * Copyright (c) 2020 alpha0010
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * https://github.com/alpha0010/react-native-file-access/blob/7179426e701fa6e54bda6c2a753cfe31a4a08293/LICENSE
 */

// Copied from v3.1.0:
// https://github.com/alpha0010/react-native-file-access/blob/v3.1.0/src/util.ts

/**
 * Escape for use as literal string in a regex.
 */
function regexEscape (literal: string) {
  return literal.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&')
}

/**
 * Condense consecutive separators.
 */
function normalizeSeparator (path: string, separator: string) {
  const sepRe = new RegExp(`(${regexEscape(separator)}){2,}`, 'g')
  return path.replace(sepRe, separator.replace(/\$/g, '$$$$'))
}

/**
 * Split path on last separator.
 */
function splitPath (path: string, separator: string) {
  let norm = normalizeSeparator(path, separator)
  if (norm === separator) {
    return { dir: separator, base: '' }
  }
  if (norm.endsWith(separator)) {
    norm = norm.substring(0, norm.length - separator.length)
  }
  const idx = norm.lastIndexOf(separator)
  if (idx === -1) {
    return { dir: '.', base: norm }
  }
  return {
    dir: norm.substring(0, idx),
    base: norm.substring(idx + separator.length)
  }
}

export const Util = {
  /**
   * Get the file/folder name from the end of the path.
   */
  basename (path: string, separator = '/') {
    return splitPath(path, separator).base
  },

  /**
   * Get the path containing the file/folder.
   */
  dirname (path: string, separator = '/') {
    return splitPath(path, separator).dir
  },

  /**
   * Get the file extension.
   */
  extname (path: string, separator = '/') {
    const extIdx = path.lastIndexOf('.')
    if (extIdx <= 0) {
      return ''
    }

    const sepIdx = path.lastIndexOf(separator)
    if (sepIdx === -1 || extIdx > sepIdx + separator.length) {
      return path.substring(extIdx + 1)
    }
    return ''
  }
}
