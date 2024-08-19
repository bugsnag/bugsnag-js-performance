import React, { useEffect } from 'react'
import type { PropsWithChildren } from 'react'
import { NavigationContext } from './navigation-context'

interface Props extends PropsWithChildren {
  on: 'mount' | 'unmount' | boolean
}

/** End the current navigation span when the component is mounted, unmounted or the `on` prop is `true` */
export const CompleteNavigation: React.FC<Props> = ({ on, children }) => {
  const context = React.useContext(NavigationContext)

  useEffect(() => {
    context.blockNavigationEnd()

    if (on === 'mount') {
      setTimeout(() => {
        context.unblockNavigationEnd('mount')
      })
    }

    return () => {
      if (on === 'unmount') {
        context.unblockNavigationEnd('unmount')
      }
    }
  }, [])

  useEffect(() => {
    if (typeof on === 'boolean') {
      if (on === true) {
        context.unblockNavigationEnd('condition')
      }
    }
  }, [on])

  return <>{children}</>
}
