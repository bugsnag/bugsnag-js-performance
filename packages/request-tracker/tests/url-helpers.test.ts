import getAbsoluteUrl from '../lib/url-helpers'

describe('getAbsoluteUrl', () => {
  it.each([
    { input: 'http://bugsnag.com', baseUrl: 'http://bugsnag.com', expected: 'http://bugsnag.com' },
    { input: 'https://bugsnag.com/test/', baseUrl: 'https://bugsnag.com', expected: 'https://bugsnag.com/test/' },
    { input: 'https://somewhere-else.com/test/', baseUrl: 'https://bugsnag.com', expected: 'https://somewhere-else.com/test/' },
    { input: '/test/page', baseUrl: 'http://bugsnag.com', expected: 'http://bugsnag.com/test/page' },
    { input: '/test/page/', baseUrl: 'http://bugsnag.com', expected: 'http://bugsnag.com/test/page/' },
    { input: '/test/page', baseUrl: 'http://bugsnag.com/home/dashboard/', expected: 'http://bugsnag.com/test/page' },
    { input: '/test/page', baseUrl: 'http://bugsnag.com/home/dashboard', expected: 'http://bugsnag.com/test/page' },
    { input: 'test/page', baseUrl: 'http://bugsnag.com/home/dashboard', expected: 'http://bugsnag.com/home/test/page' },
    { input: 'test/page', baseUrl: 'http://bugsnag.com/home/dashboard/', expected: 'http://bugsnag.com/home/dashboard/test/page' },
    { input: '//test.com', baseUrl: 'http://bugsnag.com', expected: 'http://test.com' },
    { input: '//test.com', baseUrl: 'https://bugsnag.com', expected: 'https://test.com' },
    { input: '//test.com', baseUrl: 'http://bugsnag.com/home/dashboard/', expected: 'http://test.com' },
    { input: '//test.com/test/page', baseUrl: 'http://bugsnag.com/home/dashboard/', expected: 'http://test.com/test/page' },
    { input: './test/page', baseUrl: 'http://bugsnag.com', expected: 'http://bugsnag.com/test/page' },
    { input: './test/page', baseUrl: 'http://bugsnag.com/home/dashboard/', expected: 'http://bugsnag.com/home/dashboard/test/page' },
    { input: '../test/page', baseUrl: 'http://bugsnag.com/home/dashboard/', expected: 'http://bugsnag.com/home/test/page' },
    { input: '../../test/page', baseUrl: 'http://bugsnag.com/home/dashboard/', expected: 'http://bugsnag.com/test/page' },
    { input: 'test/img.png', baseUrl: 'file:///Documents/folder/file.txt', expected: 'file:///Documents/folder/test/img.png' },
    { input: '/test/page', baseUrl: 'invalid:base', expected: '/test/page' },
    { input: 'http://bugsnag.com', expected: 'http://bugsnag.com' },
    { input: 'https://bugsnag.com/test/', expected: 'https://bugsnag.com/test/' },
    { input: 'https://somewhere-else.com/test/', expected: 'https://somewhere-else.com/test/' },
    { input: '/test/page', expected: '/test/page' }

  ])('returns \'$expected\' for URL \'$input\' and base URL \'$baseUrl\'', ({ input, baseUrl, expected }) => {
    expect(getAbsoluteUrl(input, baseUrl)).toEqual(expected)
  })
})
