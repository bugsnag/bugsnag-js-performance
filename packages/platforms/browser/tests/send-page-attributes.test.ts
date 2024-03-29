import { getPermittedAttributes, defaultSendPageAttributes, isSendPageAttributes } from '../lib/send-page-attributes'

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
    {
      url: true,
      referrer: false,
      title: false,
      unknown: true
    },
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

describe('getPermittedAttributes', () => {
  it('retains provided values', () => {
    const providedAttributes = { url: false, referrer: false, title: false }
    const compiledAttributes = getPermittedAttributes(providedAttributes)
    expect(compiledAttributes).toStrictEqual(providedAttributes)
  })

  it('completes missing values', () => {
    const compiledAttributes = getPermittedAttributes({ url: true })
    expect(compiledAttributes).toStrictEqual(defaultSendPageAttributes)
  })
})
