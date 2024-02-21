import { type InternalConfiguration, type Plugin, type SpanFactory, type SpanInternal } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { type NavigationDelegate } from 'react-native-navigation/lib/dist/src/NavigationDelegate'

class ReactNativeNavigationPlugin implements Plugin<ReactNativeConfiguration> {
  navigationSpan?: SpanInternal
  startTime?: number

  constructor (private Navigation: NavigationDelegate) {}

  private clearActiveSpan () {
    this.startTime = undefined
    this.navigationSpan = undefined
  }

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>, spanFactory: SpanFactory<ReactNativeConfiguration>) {
    this.Navigation.events().registerCommandListener((name, params) => {
      this.startTime = performance.now()
    })

    this.Navigation.events().registerComponentDidAppearListener(event => {
      const routeName = event.componentName

      if (this.startTime) {
        this.navigationSpan = spanFactory.startSpan('[Navigation]' + routeName, {
          startTime: this.startTime
        })
      }
    })

    this.Navigation.events().registerCommandCompletedListener(event => {
      const endTime = event.completionTime
      if (this.navigationSpan) {
        spanFactory.endSpan(this.navigationSpan, endTime)
        this.clearActiveSpan()
      }
    })
  }
}

export default ReactNativeNavigationPlugin
