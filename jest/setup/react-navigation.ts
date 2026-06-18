import { jest } from '@jest/globals'

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

jest.mock('react-native-screens', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native')

  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => false),
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    ScreenStackHeaderRightView: View,
    ScreenStackHeaderLeftView: View,
    ScreenStackHeaderTitleView: View,
    ScreenStackHeaderCenterView: View
  }
})
