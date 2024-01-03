import React, { PropsWithChildren } from 'react';
import { NavigationContext } from './navigation-context';

interface Props extends PropsWithChildren {
  on: 'mount' | 'unmount';
}

/** Do some cool stuff */
export class CompleteNavigation extends React.Component<Props> {
  static contextType = NavigationContext;
  
  // @ts-expect-error
  context: React.ContextType<typeof NavigationContext>;

  constructor(props: Props, context: typeof NavigationContext) {
    super(props);

    // @ts-expect-error
    context.blockNavigationEnd();
  }

  componentDidMount() {
    if (this.props.on === 'mount') {
      setTimeout(() => {
        this.context.unblockNavigationEnd();
      });
    }
  }

  componentWillUnmount() {
    if (this.props.on === 'unmount') {
      this.context.unblockNavigationEnd();
    }
  }

  render() {
    return this.props.children;
  }
}
