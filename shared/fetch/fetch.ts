/**
 * 1) get from in-memory cache if available (short TTL because it can't be emptied)
 * 2) get from Redis if available (longer TTL, can be invalidated/updated easily)
 * 3) get from Github in last resort
 */
import NodeCache from 'node-cache'
import { fetchJson, storeRedis } from '@devographics/redis'
import { SurveyMetadata, EditionMetadata } from '@devographics/types'
import {
    fetchEditionGraphQLSurveyForm,
    fetchSurveyGraphQL,
    fetchSurveysListGraphQL,
    fetchLocalesListGraphQL,
    fetchLocaleGraphQL
} from '@devographics/graphql'

const SURVEY_FORM_CONTEXT = 'surveyform'

const memoryCache = new NodeCache({
    // This TTL must stay short, because we manually invalidate this cache
    stdTTL: 5 * 60, // in seconds
    // needed for caching promises
    useClones: false
})

/**
 * Generic function to fetch something from cache, or store it if cache misses
 * @returns
 */
async function getFromCache<T = any>(
    key: string,
    fetchFunc: () => Promise<T>,
    calledFrom?: string
) {
    const calledFromLog = calledFrom ? `(↪️  ${calledFrom})` : ''
    const enableCache = !(process.env.ENABLE_CACHE === 'false')
    if (memoryCache.has(key)) {
        console.debug(`🟢 [${key}] in-memory cache hit ${calledFromLog}`)
        const res = await memoryCache.get<Promise<T>>(key)!
        return res
    } else {
        if (enableCache) {
            const redisData = await fetchJson<T>(key)
            if (redisData) {
                console.debug(`🔵 [${key}] in-memory cache miss, redis hit ${calledFromLog}`)
                return redisData
            } else {
                console.debug(
                    `🟣 [${key}] in-memory & redis cache miss, fetching from API ${calledFromLog}`
                )

                const promise = fetchFunc()
                memoryCache.set(key, promise)
                const result = await promise

                // store in Redis in the background
                await storeRedis<T>(key, result)

                return result
            }
        } else {
            console.debug(`🟠 [${key}] cache disabled, fetching from API ${calledFromLog}`)

            const promise = fetchFunc()
            memoryCache.set(key, promise)
            const result = await promise

            return result
        }
    }
}
const editionMetadataKey = ({
    context,
    surveyId,
    editionId
}: {
    context: string
    surveyId: string
    editionId: string
}) => `${context}__${surveyId}__${editionId}__metadata`

/**
 * Load the metadata of a survey edition for the surveyform app
 * @returns
 */
export async function fetchEditionMetadataSurveyForm({
    surveyId,
    editionId,
    calledFrom
}: {
    surveyId: string
    editionId: string
    calledFrom?: string
}): Promise<EditionMetadata> {
    if (!surveyId) {
        throw new Error(`surveyId not defined (calledFrom: ${calledFrom})`)
    }
    if (!editionId) {
        throw new Error(`editionId not defined (calledFrom: ${calledFrom})`)
    }
    const key = editionMetadataKey({
        context: SURVEY_FORM_CONTEXT,
        surveyId,
        editionId
    })
    return await getFromCache<EditionMetadata>(
        key,
        async () => await fetchEditionGraphQLSurveyForm({ surveyId, editionId }),
        calledFrom
    )
}

const surveysMetadataKey = ({ context }: { context: string }) => `${context}__allSurveys__metadata`

/**
 * Fetch metadata for all surveys
 * @returns
 */
export const fetchSurveysMetadata = async (options?: {
    calledFrom?: string
}): Promise<Array<SurveyMetadata>> => {
    const key = surveysMetadataKey({ context: SURVEY_FORM_CONTEXT })
    return await getFromCache<Array<SurveyMetadata>>(
        key,
        async () => await fetchSurveysListGraphQL({ includeQuestions: false }),
        options?.calledFrom
    )
}

const surveyMetadataKey = ({ context, surveyId }: { context: string; surveyId: string }) =>
    `${context}__${surveyId}__metadata`

/**
 * Fetch metadata for a single survey
 * @returns
 */
export const fetchSurveyMetadata = async ({
    surveyId
}: {
    surveyId: string
}): Promise<SurveyMetadata> => {
    if (!surveyId) {
        throw new Error('surveyId not defined')
    }
    const key = surveyMetadataKey({ context: SURVEY_FORM_CONTEXT, surveyId })
    return await getFromCache<SurveyMetadata>(
        key,
        async () => await fetchSurveyGraphQL({ surveyId })
    )
}

export const allLocalesMetadataCacheKey = ({ context }: { context: string }) =>
    `${context}__all_locales`

/**
 * Fetch metadata for all locales
 * @returns
 */
export const fetchLocalesList = async ({}: {}): Promise<any> => {
    const key = allLocalesMetadataCacheKey({ context: SURVEY_FORM_CONTEXT })
    return await getFromCache<any>(key, async () => await fetchLocalesListGraphQL({}))
}
export const localeParsedCacheKey = ({
    localeId,
    context
}: {
    localeId: string
    context: string
}) => `${context}__${localeId}__parsed`

/**
 * Fetch metadata for all locales
 * @returns
 */
export const fetchLocale = async ({ localeId }: { localeId: string }): Promise<any> => {
    const key = localeParsedCacheKey({ localeId, context: SURVEY_FORM_CONTEXT })
    return await getFromCache<any>(key, async () => await fetchLocaleGraphQL({ localeId }))
}
