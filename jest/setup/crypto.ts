import { TextDecoder, TextEncoder } from 'node:util'
import crypto from 'crypto'

Object.defineProperty(window, 'crypto', {
  get () {
    return {
      getRandomValues: crypto.getRandomValues,
      subtle: crypto.webcrypto.subtle
    }
  }
})

Object.defineProperty(window, 'TextEncoder', {
  get () { return TextEncoder }
})

Object.defineProperty(window, 'TextDecoder', {
  get () { return TextDecoder }
})
