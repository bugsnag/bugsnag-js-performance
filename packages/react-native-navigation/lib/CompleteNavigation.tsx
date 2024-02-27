import BugsnagPerformance from '@bugsnag/react-native-performance'
import React, { type PropsWithChildren } from 'react'
import ReactNativeNavigationPlugin from './react-native-navigation-plugin'

interface Props extends PropsWithChildren {
  on: 'mount' | 'unmount' | boolean
}

// @ts-expect-error throwing error for now
const getPlugin = () => BugsnagPerformance.getPlugin(ReactNativeNavigationPlugin)

/** End the current navigation span when the component is mounted, unmounted or the `on` prop is `true` */
export class CompleteNavigation extends React.Component<Props> {
  constructor (props: Props) {
    super(props)
    getPlugin()?.blockNavigationEnd()
  }

  componentDidMount () {
    if (this.props.on === 'mount') {
      setTimeout(() => {
        getPlugin()?.unblockNavigationEnd('mount')
      })
    }
  }

  componentWillUnmount () {
    if (this.props.on === 'unmount') {
      getPlugin()?.unblockNavigationEnd('unmount')
    }
  }

  componentDidUpdate (prevProps: Readonly<Props>) {
    if (typeof this.props.on === 'boolean') {
      if (this.props.on && !prevProps.on) {
        getPlugin()?.unblockNavigationEnd('condition')
      }
    }
  }

  render () {
    return this.props.children
  }
}
