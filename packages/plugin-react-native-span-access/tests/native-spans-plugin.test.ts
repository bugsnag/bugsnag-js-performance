import { PluginContext } from '@bugsnag/core-performance'
import { createConfiguration, IncrementingClock } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { BugsnagNativeSpansPlugin, NativeSpanQuery, NativeSpanControlProvider } from '../lib/native-spans-plugin'
import { TurboModuleRegistry } from 'react-native'

describe('BugsnagNativeSpansPlugin', () => {
  let plugin: BugsnagNativeSpansPlugin
  let context: PluginContext<ReactNativeConfiguration>
  let mockNativeModule: any

  beforeEach(() => {
    jest.useFakeTimers()

    // Get the mocked native module
    mockNativeModule = TurboModuleRegistry.get('BugsnagNativeSpans')

    plugin = new BugsnagNativeSpansPlugin()
    context = new PluginContext<ReactNativeConfiguration>(
      createConfiguration<ReactNativeConfiguration>(),
      new IncrementingClock()
    )

    // Clear all mock calls before each test
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('install', () => {
    it('should add span control provider when native module is available', () => {
      const addSpanControlProviderSpy = jest.spyOn(context, 'addSpanControlProvider')

      plugin.install(context)

      expect(addSpanControlProviderSpy).toHaveBeenCalledTimes(1)
      expect(addSpanControlProviderSpy).toHaveBeenCalledWith(expect.any(NativeSpanControlProvider))
    })

    it('should throw an error when native module is not available', () => {
      jest.isolateModules(() => {
        jest.mock('react-native', () => {
          return {
            TurboModuleRegistry: {
              get () {
                return null
              }
            }
          }
        })

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BugsnagNativeSpansPlugin } = require('../lib/native-spans-plugin')
        const testPlugin = new BugsnagNativeSpansPlugin()
        const addSpanControlProviderSpy = jest.spyOn(context, 'addSpanControlProvider')

        expect(() => { testPlugin.install(context) }).toThrow('BugsnagNativeSpans module is not available. Ensure the native module is linked correctly.')
        expect(addSpanControlProviderSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('NativeSpanQuery', () => {
    it('should create a query with the correct name', () => {
      const query = new NativeSpanQuery('testSpan')
      expect(query.name).toBe('testSpan')
      expect(query).toBeInstanceOf(NativeSpanQuery)
    })
  })

  describe('NativeSpanControlProvider', () => {
    let provider: NativeSpanControlProvider
    let clock: IncrementingClock

    beforeEach(() => {
      clock = new IncrementingClock()
      provider = new NativeSpanControlProvider(clock)
    })

    describe('getSpanControls', () => {
      it('should return null when native module is not available', () => {
        jest.isolateModules(() => {
          jest.mock('react-native', () => {
            return {
              TurboModuleRegistry: {
                get () {
                  return null
                }
              }
            }
          })

          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { NativeSpanControlProvider } = require('../lib/native-spans-plugin')
          const testProvider = new NativeSpanControlProvider(clock)

          const query = new NativeSpanQuery('testSpan')
          const result = testProvider.getSpanControls(query)

          expect(result).toBeNull()
        })
      })

      it('should return null when query is not a NativeSpanQuery', () => {
        const query = { type: 'different' }
        const result = provider.getSpanControls(query)

        expect(result).toBeNull()
      })

      it('should return null when span is not found by name', () => {
        mockNativeModule.getSpanIdByName.mockReturnValue(undefined)

        const query = new NativeSpanQuery('nonExistentSpan')
        const result = provider.getSpanControls(query)

        expect(result).toBeNull()
        expect(mockNativeModule.getSpanIdByName).toHaveBeenCalledWith('nonExistentSpan')
      })

      it('should return NativeSpanControl when span is found', () => {
        const mockSpanId = {
          spanId: 'test-span-id',
          traceId: 'test-trace-id'
        }
        mockNativeModule.getSpanIdByName.mockReturnValue(mockSpanId)

        const query = new NativeSpanQuery('existingSpan')
        const result = provider.getSpanControls(query)

        expect(result).not.toBeNull()
        expect(result?.id).toBe('test-span-id')
        expect(result?.traceId).toBe('test-trace-id')
        expect(mockNativeModule.getSpanIdByName).toHaveBeenCalledWith('existingSpan')
      })
    })
  })

  describe('NativeSpanControl', () => {
    let spanControl: any
    let clock: IncrementingClock

    beforeEach(() => {
      clock = new IncrementingClock()
      const provider = new NativeSpanControlProvider(clock)

      const mockSpanId = {
        spanId: 'test-span-id',
        traceId: 'test-trace-id'
      }
      mockNativeModule.getSpanIdByName.mockReturnValue(mockSpanId)

      const query = new NativeSpanQuery('testSpan')
      spanControl = provider.getSpanControls(query)
    })

    describe('updateSpan', () => {
      it('should call native module updateSpan with correct parameters', async () => {
        mockNativeModule.updateSpan.mockResolvedValue(true)

        const result = await spanControl.updateSpan((mutator: any) => {
          mutator.setAttribute('testAttribute', 'testValue')
        })

        expect(result).toBe(true)
        expect(mockNativeModule.updateSpan).toHaveBeenCalledWith(
          { spanId: 'test-span-id', traceId: 'test-trace-id' },
          {
            attributes: [{ name: 'testAttribute', value: 'testValue' }],
            isEnded: false
          }
        )
      })

      it('should handle end time correctly', async () => {
        mockNativeModule.updateSpan.mockResolvedValue(true)
        clock.now = jest.fn(() => 1234567)
        clock.toUnixNanoseconds = jest.fn(() => 1234567000000000)

        const result = await spanControl.updateSpan((mutator: any) => {
          mutator.end()
        })

        expect(result).toBe(true)
        expect(mockNativeModule.updateSpan).toHaveBeenCalledWith(
          { spanId: 'test-span-id', traceId: 'test-trace-id' },
          {
            attributes: [],
            isEnded: true,
            endTime: 1234567000000000
          }
        )
      })

      it('should handle end time with custom time', async () => {
        mockNativeModule.updateSpan.mockResolvedValue(true)
        clock.now = jest.fn(() => 1234567)
        clock.toUnixNanoseconds = jest.fn(() => 9876543000000000)

        const customTime = 9876543
        const result = await spanControl.updateSpan((mutator: any) => {
          mutator.end(customTime)
        })

        expect(result).toBe(true)
        expect(mockNativeModule.updateSpan).toHaveBeenCalledWith(
          { spanId: 'test-span-id', traceId: 'test-trace-id' },
          {
            attributes: [],
            isEnded: true,
            endTime: 9876543000000000
          }
        )
      })

      it('should handle multiple attributes', async () => {
        mockNativeModule.updateSpan.mockResolvedValue(true)

        const result = await spanControl.updateSpan((mutator: any) => {
          mutator.setAttribute('attr1', 'value1')
          mutator.setAttribute('attr2', 123)
          mutator.setAttribute('attr3', true)
          mutator.setAttribute('attr4', null)
        })

        expect(result).toBe(true)
        expect(mockNativeModule.updateSpan).toHaveBeenCalledWith(
          { spanId: 'test-span-id', traceId: 'test-trace-id' },
          {
            attributes: [
              { name: 'attr1', value: 'value1' },
              { name: 'attr2', value: 123 },
              { name: 'attr3', value: true },
              { name: 'attr4', value: null }
            ],
            isEnded: false
          }
        )
      })

      it('should handle both attributes and end time', async () => {
        mockNativeModule.updateSpan.mockResolvedValue(true)
        clock.now = jest.fn(() => 1234567)
        clock.toUnixNanoseconds = jest.fn(() => 1234567000000000)

        const result = await spanControl.updateSpan((mutator: any) => {
          mutator.setAttribute('finalAttribute', 'finalValue')
          mutator.end()
        })

        expect(result).toBe(true)
        expect(mockNativeModule.updateSpan).toHaveBeenCalledWith(
          { spanId: 'test-span-id', traceId: 'test-trace-id' },
          {
            attributes: [{ name: 'finalAttribute', value: 'finalValue' }],
            isEnded: true,
            endTime: 1234567000000000
          }
        )
      })

      it('should propagate native module response', async () => {
        mockNativeModule.updateSpan.mockResolvedValue(false)

        const result = await spanControl.updateSpan((mutator: any) => {
          mutator.setAttribute('testAttribute', 'testValue')
        })

        expect(result).toBe(false)
      })

      it('should handle native module rejection', async () => {
        const error = new Error('Native module error')
        mockNativeModule.updateSpan.mockRejectedValue(error)

        await expect(spanControl.updateSpan((mutator: any) => {
          mutator.setAttribute('testAttribute', 'testValue')
        })).rejects.toThrow('Native module error')
      })

      it('should handle setAttribute with undefined value', async () => {
        mockNativeModule.updateSpan.mockResolvedValue(true)

        const result = await spanControl.updateSpan((mutator: any) => {
          mutator.setAttribute('undefinedAttribute')
        })

        expect(result).toBe(true)
        expect(mockNativeModule.updateSpan).toHaveBeenCalledWith(
          { spanId: 'test-span-id', traceId: 'test-trace-id' },
          {
            attributes: [{ name: 'undefinedAttribute', value: undefined }],
            isEnded: false
          }
        )
      })
    })
  })
})
