import { normalizeCurrencyCode } from "../normalize-currency-code"

describe("normalizeCurrencyCode", () => {
    it("returns lowercased currency code", () => {
        const uppercased = "USD"
        const result = normalizeCurrencyCode(uppercased)

        expect(result).toEqual("usd")
    })

    it("returns undefined when value is not a string", () => {
        const number = 1
        const numberResult = normalizeCurrencyCode(number)
        const undefinedResult = normalizeCurrencyCode(undefined)

        expect(numberResult).toBeUndefined()
        expect(undefinedResult).toBeUndefined()
    })
})