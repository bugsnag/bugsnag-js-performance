import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { type PropsWithChildren } from 'react'
import ReactNativeNavigationPlugin from './react-native-navigation-plugin'

interface Props extends PropsWithChildren {
  on: 'mount' | 'unmount' | boolean
}

/** End the current navigation span when the component is mounted, unmounted or the `on` prop is `true` */
export class CompleteNavigation extends React.Component<Props> {
  private _plugin?: ReactNativeNavigationPlugin

  private get plugin () {
    if (this._plugin) return this._plugin

    // @ts-expect-error signature does not match
    this._plugin = BugsnagPerformance.getPlugin(ReactNativeNavigationPlugin)

    return this._plugin
  }

  constructor (props: Props) {
    super(props)

    if (this.plugin) {
      this.plugin.blockNavigationEnd()
    }
  }

  componentDidMount () {
    if (this.props.on === 'mount') {
      setTimeout(() => {
        if (this.plugin) {
          this.plugin.unblockNavigationEnd('mount')
        }
      })
    }
  }

  componentWillUnmount () {
    if (this.props.on === 'unmount' && this.plugin) {
      this.plugin.unblockNavigationEnd('unmount')
    }
  }

  componentDidUpdate (prevProps: Readonly<Props>) {
    if (typeof this.props.on === 'boolean') {
      if (this.props.on && !prevProps.on && this.plugin) {
        this.plugin.unblockNavigationEnd('condition')
      }
    }
  }

  render () {
    return this.props.children
  }
}
