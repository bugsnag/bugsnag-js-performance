export const Navigation = {
  events: jest.fn().mockReturnValue({
    registerCommandListener: jest.fn(),
    registerComponentDidAppearListener: jest.fn()
  })
}
