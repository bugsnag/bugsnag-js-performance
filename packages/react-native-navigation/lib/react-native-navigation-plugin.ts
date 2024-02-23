import { type InternalConfiguration, type Plugin, type SpanFactory, type SpanInternal } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from '@bugsnag/react-native-performance'
import { type NavigationDelegate } from 'react-native-navigation/lib/dist/src/NavigationDelegate'

class ReactNativeNavigationPlugin implements Plugin<ReactNativeConfiguration> {
  private startTime?: number
  private startTimeout?: NodeJS.Timeout
  private endTimeout?: NodeJS.Timeout
  private navigationSpan?: SpanInternal

  constructor (private Navigation: NavigationDelegate) {}

  private clearActiveSpan () {
    clearTimeout(this.startTimeout)
    clearTimeout(this.endTimeout)
    this.startTime = undefined
    this.navigationSpan = undefined
  }

  /** Trigger the end of the current navigation span after 100ms */
  private triggerNavigationEnd = (spanFactory: SpanFactory<ReactNativeConfiguration>) => {
    const endTime = performance.now()
    this.endTimeout = setTimeout(() => {
      if (this.navigationSpan) {
        spanFactory.endSpan(this.navigationSpan, endTime)
        this.clearActiveSpan()
      }
    }, 100)
  }

  configure (configuration: InternalConfiguration<ReactNativeConfiguration>, spanFactory: SpanFactory<ReactNativeConfiguration>) {
    // Potential for a navigation to occur
    this.Navigation.events().registerCommandListener((name, params) => {
      this.clearActiveSpan()
      this.startTime = performance.now()
      this.startTimeout = setTimeout(() => {
        this.clearActiveSpan()
      }, 1000)
    })

    // Navigation has occurred
    this.Navigation.events().registerComponentDidAppearListener(event => {
      if (typeof this.startTime === 'number') {
        const routeName = event.componentName
        this.navigationSpan = spanFactory.startSpan('[Navigation]' + routeName, {
          startTime: this.startTime,
          isFirstClass: false,
          parentContext: null
        })

        this.navigationSpan.setAttribute('bugsnag.span.category', 'navigation')
        this.navigationSpan.setAttribute('bugsnag.navigation.route', routeName)
        this.navigationSpan.setAttribute('bugsnag.navigation.triggered_by', '@bugsnag/react-native-navigation-performance')

        this.triggerNavigationEnd(spanFactory)
      }
    })
  }
}

export default ReactNativeNavigationPlugin
