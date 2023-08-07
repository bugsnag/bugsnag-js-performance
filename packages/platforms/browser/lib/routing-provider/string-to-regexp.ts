/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Blake Embrey (hello@blakeembrey.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Substantially based on https://github.com/pillarjs/path-to-regexp/blob/master/src/index.ts

/**
 * Tokenizer results.
 */
interface LexToken {
  type:
  | 'OPEN'
  | 'CLOSE'
  | 'PATTERN'
  | 'NAME'
  | 'CHAR'
  | 'ESCAPED_CHAR'
  | 'MODIFIER'
  | 'END'
  index: number
  value: string
}

/**
 * Tokenize input string.
 */
function lexer (str: string): LexToken[] {
  const tokens: LexToken[] = []
  let i = 0

  while (i < str.length) {
    const char = str[i]

    if (char === '*' || char === '+' || char === '?') {
      tokens.push({ type: 'MODIFIER', index: i, value: str[i++] })
      continue
    }

    if (char === '\\') {
      tokens.push({ type: 'ESCAPED_CHAR', index: i++, value: str[i++] })
      continue
    }

    if (char === '{') {
      tokens.push({ type: 'OPEN', index: i, value: str[i++] })
      continue
    }

    if (char === '}') {
      tokens.push({ type: 'CLOSE', index: i, value: str[i++] })
      continue
    }

    if (char === ':') {
      let name = ''
      let j = i + 1

      while (j < str.length) {
        const code = str.charCodeAt(j)

        if (
        // `0-9`
          (code >= 48 && code <= 57) ||
            // `A-Z`
            (code >= 65 && code <= 90) ||
            // `a-z`
            (code >= 97 && code <= 122) ||
            // `_`
            code === 95
        ) {
          name += str[j++]
          continue
        }

        break
      }

      if (!name) throw new TypeError(`Missing parameter name at ${i}`)

      tokens.push({ type: 'NAME', index: i, value: name })
      i = j
      continue
    }

    if (char === '(') {
      let count = 1
      let pattern = ''
      let j = i + 1

      if (str[j] === '?') {
        throw new TypeError(`Pattern cannot start with "?" at ${j}`)
      }

      while (j < str.length) {
        if (str[j] === '\\') {
          pattern += str[j++] + str[j++]
          continue
        }

        if (str[j] === ')') {
          count--
          if (count === 0) {
            j++
            break
          }
        } else if (str[j] === '(') {
          count++
          if (str[j + 1] !== '?') {
            throw new TypeError(`Capturing groups are not allowed at ${j}`)
          }
        }

        pattern += str[j++]
      }

      if (count) throw new TypeError(`Unbalanced pattern at ${i}`)
      if (!pattern) throw new TypeError(`Missing pattern at ${i}`)

      tokens.push({ type: 'PATTERN', index: i, value: pattern })
      i = j
      continue
    }

    tokens.push({ type: 'CHAR', index: i, value: str[i++] })
  }

  tokens.push({ type: 'END', index: i, value: '' })

  return tokens
}

/**
 * Parse a string for the raw tokens.
 */
function parse (str: string): Token[] {
  const tokens = lexer(str)
  const prefixes = './'
  const defaultPattern = `[^${escapeString('/#?')}]+?`
  const result: Token[] = []
  let key = 0
  let i = 0
  let path = ''

  const tryConsume = (type: LexToken['type']): string | undefined => {
    if (i < tokens.length && tokens[i].type === type) return tokens[i++].value
  }

  const mustConsume = (type: LexToken['type']): string => {
    const value = tryConsume(type)
    if (value !== undefined) return value
    const { type: nextType, index } = tokens[i]
    throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`)
  }

  const consumeText = (): string => {
    let result = ''
    let value: string | undefined
    while ((value = tryConsume('CHAR') || tryConsume('ESCAPED_CHAR'))) {
      result += value
    }
    return result
  }

  while (i < tokens.length) {
    const char = tryConsume('CHAR')
    const name = tryConsume('NAME')
    const pattern = tryConsume('PATTERN')

    if (name || pattern) {
      let prefix = char || ''

      if (prefixes.indexOf(prefix) === -1) {
        path += prefix
        prefix = ''
      }

      if (path) {
        result.push(path)
        path = ''
      }

      result.push({
        name: name || key++,
        prefix,
        suffix: '',
        pattern: pattern || defaultPattern,
        modifier: tryConsume('MODIFIER') || ''
      })
      continue
    }

    const value = char || tryConsume('ESCAPED_CHAR')
    if (value) {
      path += value
      continue
    }

    if (path) {
      result.push(path)
      path = ''
    }

    const open = tryConsume('OPEN')
    if (open) {
      const prefix = consumeText()
      const name = tryConsume('NAME') || ''
      const pattern = tryConsume('PATTERN') || ''
      const suffix = consumeText()

      mustConsume('CLOSE')

      result.push({
        name: name || (pattern ? key++ : ''),
        pattern: name && !pattern ? defaultPattern : pattern,
        prefix,
        suffix,
        modifier: tryConsume('MODIFIER') || ''
      })
      continue
    }

    mustConsume('END')
  }

  return result
}

/**
 * Escape a regular expression string.
 */
function escapeString (str: string) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

/**
 * Metadata about a key.
 */
interface Key {
  name: string | number
  prefix: string
  suffix: string
  pattern: string
  modifier: string
}

/**
 * A token is a string (nothing special) or key metadata (capture group).
 */
type Token = string | Key

/**
 * Create a path regexp from string input.
 */
export function stringToRegexp (
  path: string
) {
  const tokens = parse(path)
  const strict = false
  const start = true
  const end = true
  const encode = (x: string) => x
  const delimiter = '/#?'
  const endsWith = ''
  const endsWithRe = `[${escapeString(endsWith)}]|$`
  const delimiterRe = `[${escapeString(delimiter)}]`
  let route = start ? '^' : ''

  // Iterate over the tokens and create our regexp string.
  for (const token of tokens) {
    if (typeof token === 'string') {
      route += escapeString(encode(token))
    } else {
      const prefix = escapeString(encode(token.prefix))
      const suffix = escapeString(encode(token.suffix))

      if (token.pattern) {
        if (prefix || suffix) {
          if (token.modifier === '+' || token.modifier === '*') {
            const mod = token.modifier === '*' ? '?' : ''
            route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`
          } else {
            route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`
          }
        } else {
          if (token.modifier === '+' || token.modifier === '*') {
            route += `((?:${token.pattern})${token.modifier})`
          } else {
            route += `(${token.pattern})${token.modifier}`
          }
        }
      } else {
        route += `(?:${prefix}${suffix})${token.modifier}`
      }
    }
  }

  if (end) {
    if (!strict) route += `${delimiterRe}?`

    route += '$'
  } else {
    const endToken = tokens[tokens.length - 1]
    const isEndDelimited =
          typeof endToken === 'string'
            ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
            : endToken === undefined

    if (!strict) {
      route += `(?:${delimiterRe}(?=${endsWithRe}))?`
    }

    if (!isEndDelimited) {
      route += `(?=${delimiterRe}|${endsWithRe})`
    }
  }

  return new RegExp(route, 'i')
}
