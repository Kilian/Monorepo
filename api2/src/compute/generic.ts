import { inspect } from 'util'
import config from '../config'
import { generateFiltersQuery } from '../filters'
import { computeParticipationByYear } from './demographics'
import { getGenericPipeline } from './generic_pipeline'
import { computeCompletionByYear } from './completion'
import { getChartKeys } from '../helpers'
import isEmpty from 'lodash/isEmpty.js'
import { getFacetSegments } from '../helpers'
import {
    RequestContext,
    GenericComputeArguments,
    Survey,
    Edition,
    Section,
    ParsedQuestion,
    EditionData,
    ComputeAxisParameters,
    SortProperty
} from '../types'

import {
    discardEmptyIds,
    // addMissingBucketValues,
    addEntities,
    addCompletionCounts,
    addPercentages,
    // addMeans,
    sortData,
    limitData,
    cutoffData
} from './stages/index'

const convertOrder = (order: 'asc' | 'desc') => (order === 'asc' ? 1 : -1)

export async function genericComputeFunction({
    context,
    survey,
    edition,
    section,
    question,
    questionObjects,
    computeArguments
}: {
    context: RequestContext
    survey: Survey
    edition: Edition
    section: Section
    question: ParsedQuestion
    questionObjects: ParsedQuestion[]
    computeArguments: GenericComputeArguments
}) {
    let axis1: ComputeAxisParameters,
        axis2: ComputeAxisParameters | null = null
    const { db, isDebug } = context
    const collection = db.collection(config.mongo.normalized_collection)

    const { dbPath } = question

    const { filters, parameters = {}, facet, selectedEditionId } = computeArguments
    const {
        cutoff = 1,
        cutoffPercent,
        sort,
        limit = 50,
        facetSort,
        facetLimit = 50,
        facetCutoff = 1,
        facetCutoffPercent
    } = parameters

    const options = question.options && question.options.map(o => o.id)

    /*

    Axis 1

    */
    axis1 = {
        question,
        sort: sort?.property ?? (question.defaultSort as SortProperty) ?? 'count',
        order: convertOrder(sort?.order ?? 'desc'),
        cutoff,
        limit
    }
    if (options) {
        axis1.options = options
    }

    /*

    Axis 2

    
    */
    if (facet) {
        let [sectionId, facetId] = facet?.split('__')
        const facetQuestion = questionObjects.find(
            q => q.id === facetId && q.surveyId === survey.id
        )
        if (facetQuestion) {
            axis2 = {
                question: facetQuestion,
                sort: facetSort?.property ?? (facetQuestion.defaultSort as SortProperty) ?? 'count',
                order: convertOrder(facetSort?.order ?? 'desc'),
                cutoff: facetCutoff,
                cutoffPercent: facetCutoffPercent,
                limit: facetLimit
            }
            const facetOptions = facetQuestion?.options?.map(o => o.id)
            if (facetOptions) {
                axis2.options = facetOptions
            }
            // switch both axes in order to get a better result object structure
            const temp = axis1
            axis1 = axis2
            axis2 = temp
        }
    }

    console.log('// computeArguments')
    console.log(computeArguments)
    console.log('// axis1')
    console.log(axis1)
    console.log('// axis2')
    console.log(axis2)

    if (!dbPath) {
        throw new Error(`No dbPath found for question id ${question.id}`)
    }

    let match: any = {
        survey: survey.id,
        [dbPath]: { $nin: [null, '', [], {}] }
    }
    if (filters) {
        const filtersQuery = await generateFiltersQuery({ filters, dbPath })
        match = { ...match, ...filtersQuery }
    }
    // if edition is passed, restrict aggregation to specific edition
    if (selectedEditionId) {
        match.surveySlug = selectedEditionId
    }

    // TODO: merge these counts into the main aggregation pipeline if possible
    const totalRespondentsByYear = await computeParticipationByYear({ context, survey })
    const completionByYear = await computeCompletionByYear({ context, match })

    const pipelineProps = {
        surveyId: survey.id,
        selectedEditionId,
        filters,
        axis1,
        axis2
    }

    const pipeline = await getGenericPipeline(pipelineProps)

    let results = (await collection.aggregate(pipeline).toArray()) as EditionData[]

    if (isDebug) {
        console.log(
            inspect(
                {
                    match,
                    pipeline,
                    results
                },
                { colors: true, depth: null }
            )
        )
    }

    if (!facet) {
        // if no facet is specified, move default buckets down one level
        results = results.map(editionData => {
            const { buckets, ...rest } = editionData
            return { ...rest, buckets: results[0].buckets[0].facetBuckets }
        })
    }

    console.log('// results 1')
    console.log(JSON.stringify(results, undefined, 2))

    await discardEmptyIds(results)

    if (axis1.options) {
        // await addMissingBucketValues(results, axis1.options)
    }

    await addEntities(results, context)

    await addCompletionCounts(results, totalRespondentsByYear, completionByYear)

    await addPercentages(results)

    //// await addDeltas(results)

    if (axis2) {
        await sortData(results, axis2, axis1)
        await limitData(results, axis2, axis1)
        await cutoffData(results, axis2, axis1)
    } else {
        await sortData(results, axis1)
        await limitData(results, axis1)
        await cutoffData(results, axis1)
    }

    if (axis1.options) {
        // await addMeans(results, axis1.options)
    }

    console.log('// results final')
    console.log(JSON.stringify(results, undefined, 2))

    return results
}

// export async function computeTermAggregationAllYears(funcOptions: {
//     context: RequestContext
//     survey: SurveyConfig
//     key: string
//     options: TermAggregationOptions
//     aggregationFunction?: AggregationFunction
// }) {
//     const { aggregationFunction = computeDefaultTermAggregationByYear, ...options } = funcOptions
//     return aggregationFunction(options)
// }

// export async function computeTermAggregationAllYearsWithCache({
//     context,
//     survey,
//     key,
//     options = {},
//     aggregationFunction
// }: {
//     context: RequestContext
//     survey: SurveyConfig
//     key: string
//     options: TermAggregationOptions
//     aggregationFunction?: AggregationFunction
// }) {
//     return useCache({
//         func: computeTermAggregationAllYears,
//         context,
//         funcOptions: {
//             survey,
//             key,
//             options,
//             aggregationFunction
//         }
//     })
// }

// export async function computeTermAggregationSingleYear({
//     context,
//     survey,
//     key,
//     options,
//     aggregationFunction
// }: {
//     context: RequestContext
//     survey: SurveyConfig
//     key: string
//     options: TermAggregationOptions
//     aggregationFunction?: AggregationFunction
// }) {
//     const allYears = await computeTermAggregationAllYears({
//         context,
//         survey,
//         key,
//         options,
//         aggregationFunction
//     })
//     return allYears[0]
// }

// export async function computeTermAggregationSingleYearWithCache({
//     context,
//     survey,
//     key,
//     options,
//     aggregationFunction
// }: {
//     context: RequestContext
//     survey: SurveyConfig
//     key: string
//     options: TermAggregationOptions
//     aggregationFunction?: AggregationFunction
// }) {
//     return useCache({
//         func: computeTermAggregationSingleYear,
//         context,
//         funcOptions: {
//             survey,
//             key,
//             options,
//             aggregationFunction
//         }
//     })
// }
