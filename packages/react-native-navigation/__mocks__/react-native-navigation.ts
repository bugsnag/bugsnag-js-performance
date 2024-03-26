export const Navigation = {
  events: jest.fn().mockReturnValue({
    registerCommandListener: jest.fn(),
    registerComponentWillAppearListener: jest.fn()
  })
}
