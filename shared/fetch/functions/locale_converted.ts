import { LocaleDefWithStrings } from '@devographics/types'
import { localeCacheKey } from '../cache_keys'
import { fetchGraphQLApi, getFromCache } from '../fetch'
import { getLocaleQuery } from '../queries'
import { FetcherFunctionOptions } from '../types'

/**
 * Fetch metadata and strings for a specific locale
 * with strings in a format expected by surveyform and other apps
 * @returns
 */
export const fetchLocaleConverted = async (
    options: FetcherFunctionOptions & {
        localeId: string
        contexts: string[]
    }
) => {
    const { localeId } = options
    const getQuery = options.getQuery || getLocaleQuery
    const query = getQuery(options)
    const key = localeCacheKey(options)
    const result = await getFromCache<LocaleDefWithStrings>({
        key,
        fetchFunction: async () => {
            const result = await fetchGraphQLApi<{ locale: { strings: Array<{ key: string, t: string, tHtml: string }> } }>({
                query,
                key
            })
            if (!result) throw new Error(`Couldn't fetch locale ${localeId}`)
            const locale = result.locale

            // react-i18n expects {foo1: bar1, foo2: bar2} etc. map whereas
            // api returns [{key: foo1, t: bar1}, {key: foo2, t: bar2}] etc. array
            const convertedStrings: { [key: string]: string } = {}
            locale.strings &&
                locale.strings.forEach(({ key, t, tHtml }) => {
                    convertedStrings[key] = tHtml || t
                })
            const convertedLocale = { ...locale, strings: convertedStrings }

            return convertedLocale as LocaleDefWithStrings
        },
        ...options
    })
    return result
}
