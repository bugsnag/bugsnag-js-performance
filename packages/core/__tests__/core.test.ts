import core from ".."

describe('core', () => {
    it('returns a string', () => {
        expect(core()).toStrictEqual('Hello from core')
    })
})
