import { NavigationContainer } from '@react-navigation/native'
import { render } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'
import { createNavigationContainer } from '../lib/create-navigation-container'

describe('createNavigationContainer', () => {
  it('returns an instance of the component', () => {
    const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer)

    render(
      <BugsnagNavigationContainer>
        <Text>Test</Text>
      </BugsnagNavigationContainer>
    )

    expect(BugsnagNavigationContainer).toBeTruthy()
  })
})
