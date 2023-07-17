import { compileAttributes, defaultSendPageAttributes, isSendPageAttributes } from '../lib/send-page-attributes'

describe('isSendPageAttributes', () => {
  const valid = [
    defaultSendPageAttributes,
    {
      url: false,
      referrer: false,
      title: false
    },
    { url: true },
    { referrer: false },
    { title: true },
    {}
  ]

  it.each(valid)('returns true for a valid list of attributes', (value) => {
    expect(isSendPageAttributes(value)).toBe(true)
  })

  const invalid = [
    {
      url: 'string',
      referrer: false,
      title: false
    },
    {
      url: true,
      referrer: false,
      title: false,
      unknown: true
    },
    () => [],
    [],
    true,
    false,
    null,
    undefined,
    'string',
    1234,
    Symbol('title')
  ]

  it.each(invalid)('returns false for an invalid list of attributes', (value) => {
    expect(isSendPageAttributes(value)).toBe(false)
  })
})

describe('compileAttributes', () => {
  it('retains provided values', () => {
    const providedAttributes = { url: false, referrer: false, title: false }
    const compiledAttributes = compileAttributes(providedAttributes)
    expect(compiledAttributes).toStrictEqual(providedAttributes)
  })

  it('completes missing values', () => {
    const compiledAttributes = compileAttributes({ url: true })
    expect(compiledAttributes).toStrictEqual(defaultSendPageAttributes)
  })
})
