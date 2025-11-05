import { isString } from "./is-string"

/**
 * Normalizes `currencyCode` by transforming it to lowercase
 */
export function normalizeCurrencyCode(currencyCode: string | undefined) {
    if (!isString(currencyCode)) {
        return
    }

    return currencyCode.toLowerCase()
}