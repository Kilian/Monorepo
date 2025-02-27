import omit from 'lodash/omit.js'
import merge from 'lodash/merge.js'
import path from 'path'
import fs from 'fs'
import fetch from 'node-fetch'
import yaml from 'js-yaml'
import { TwitterApi } from 'twitter-api-v2'
import { logToFile } from './log_to_file.mjs'
import { argumentsPlaceholder, getFiltersQuery, getQuery } from './queries.mjs'
import { fileURLToPath } from 'url'
import without from 'lodash/without.js'
import { getMetadataQuery } from './queries.mjs'

import { parse } from 'graphql'
import { print } from 'graphql-print'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const fsPromises = fs.promises
/*

Get the localized version of a page path

*/
export const getLocalizedPath = (path, locale) => (locale ? `/${locale.id}${path}` : path)

/*

Get locales without the strings, to avoid loading every locale's dictionnary in memory

Also add paths

*/
export const getCleanLocales = locales =>
    locales.map(l => ({ path: `/${l.id}`, ...omit(l, ['strings']) }))

/*


*/

/**
 *
 * Get a page's context
 *= the information that are passed down from Gatsby to the page
 * @param {import("../src/core/types").PageDef} page
 * @returns {import("../src/core/types").PageContextValue}
 */
export const getPageContext = page => {
    const context = omit(page, ['path', 'children'])
    context.basePath = page.path

    return {
        ...context,
        ...page.data
    }
}

/*

Load a template yml file

*/
export const loadTemplate = async name => {
    const templatePath = `${path.join(__dirname, '../')}src/templates/${name}.yml`
    try {
        const data = await fsPromises.readFile(templatePath, 'utf8')
        const yamlData = yaml.load(data)
        yamlData.name = name
        return yamlData
    } catch (error) {
        console.log(`// Error loading template ${name}`)
        console.log(error)
    }
}

/*

Create individual pages for each block (for social media meta tags)

*/
export const createBlockPages = (page, context, createPage, locales, buildInfo) => {
    const blocks = page.blocks
    if (!Array.isArray(blocks) || blocks.length === 0) {
        return
    }

    blocks.forEach(block => {
        if (!block.disableExport) {
            block.variants.forEach(blockVariant => {
                // allow for specifying explicit pageId in block definition
                if (!blockVariant.pageId) {
                    blockVariant.pageId = page.id
                }
                locales.forEach(locale => {
                    buildInfo.blockCount++

                    const blockPage = {
                        // defer: true,
                        path: getLocalizedPath(blockVariant.path, locale),
                        component: path.resolve(`./src/core/share/ShareBlockTemplate.tsx`),
                        context: {
                            ...context,
                            redirect: `${getLocalizedPath(page.path, locale)}#${blockVariant.id}`,
                            block: blockVariant,
                            locales: getCleanLocales(locales),
                            locale,
                            localeId: locale.id
                        }
                    }
                    createPage(blockPage)
                })
            })
        }
    })
}

/*

Get a file from the disk or from GitHub

*/
export const getExistingData = async ({ dataFileName, dataFilePath, sectionId, baseUrl }) => {
    let contents, data
    const remoteUrl = `${baseUrl}/data/${sectionId}/${dataFileName}`
    if (getLoadMethod() === 'local') {
        if (fs.existsSync(dataFilePath)) {
            contents = fs.readFileSync(dataFilePath, 'utf8')
        }
    } else {
        const response = await fetch(remoteUrl)
        contents = await response.text()
    }
    try {
        data = JSON.parse(contents)
    } catch (error) {
        return
    }
    return data
}

// if SURVEYS_URL is defined, then use that to load surveys;
// if not, look in local filesystem
export const getLoadMethod = () => (process.env.SURVEYS_URL ? 'remote' : 'local')

export const getDataLocations = (surveyId, editionId) => {
    return {
        localPath: `${process.env.SURVEYS_PATH}/${surveyId}/${editionId}`,
        url: `${process.env.SURVEYS_URL}/${surveyId}/${editionId}`
    }
}

/*

Try loading data from disk or GitHub, or else run queries for *each block* in a page

*/
export const runPageQueries = async ({ page, graphql, surveyId, editionId, currentEdition }) => {
    const startedAt = new Date()
    const useFilesystemCache = getCachingMethods().filesystem
    const useApiCache = getCachingMethods().api
    console.log(`// 🔍 Running GraphQL queries for page ${page.id}…`)

    const paths = getDataLocations(surveyId, editionId)

    const basePath = paths.localPath + '/results'
    const baseUrl = paths.url + '/results'

    let pageData = {}

    for (const b of page.blocks) {
        for (const block of b.variants) {
            if (block.query) {
                let data

                const dataDirPath = path.resolve(`${basePath}/data/${page.id}`)
                const dataFileName = `${block.id}.json`
                const dataFilePath = `${dataDirPath}/${dataFileName}`
                const queryDirPath = path.resolve(`${basePath}/queries/${page.id}`)
                const queryFileName = `${block.id}.graphql`
                const queryFilePath = `${queryDirPath}/${queryFileName}`

                const existingData = await getExistingData({
                    dataFileName,
                    dataFilePath,
                    baseUrl,
                    sectionId: page.id
                })
                if (existingData && useFilesystemCache) {
                    console.log(
                        `// 🎯 File ${dataFileName} found on ${getLoadMethod()}, loading its contents…`
                    )
                    data = existingData
                } else {
                    const questionId = block.id
                    const queryOptions = {
                        surveyId,
                        editionId,
                        sectionId: page.id,
                        questionId,
                        fieldId: block.fieldId,
                        isLog: false,
                        addRootNode: true,
                        ...block.queryOptions
                    }

                    const queryArgs = {
                        facet: block.facet,
                        filters: block.filters,
                        parameters: { ...block.parameters, enableCache: useApiCache },
                        xAxis: block?.variables?.xAxis,
                        yAxis: block?.variables?.yAxis
                    }

                    let query

                    if (block.filtersState) {
                        const filtersQueryResult = getFiltersQuery({
                            block,
                            queryOptions,
                            chartFilters: block.filtersState,
                            currentYear: currentEdition.year
                        })
                        query = filtersQueryResult.query
                    } else {
                        query = getQuery({
                            query: block.query,
                            queryOptions,
                            queryArgs
                        })
                    }

                    if (query.includes('dataAPI')) {
                        // note: this duplicates the if (block.filtersState) {...} logic above
                        // TODO: group getFiltersQuery and getQuery in a single function
                        let queryLog
                        if (block.filtersState) {
                            const filtersQueryResult = getFiltersQuery({
                                block,
                                queryOptions: { ...queryOptions, isLog: true, addRootNode: false },
                                chartFilters: block.filtersState,
                                currentYear: currentEdition.year
                            })
                            queryLog = filtersQueryResult.query
                        } else {
                            queryLog = getQuery({
                                query: block.query,
                                queryOptions: { ...queryOptions, isLog: true, addRootNode: false },
                                queryArgs
                            })
                        }

                        let prettyQueryLog = queryLog.replace(argumentsPlaceholder, '')
                        // try {
                        //     const ast = parse(queryLog)
                        //     prettyQueryLog = print(ast, { preserveComments: true })
                        // } catch (error) {
                        //     console.log(`error parsing query for ${block.id}`)
                        //     console.log(queryLog)
                        // }
                        logToFile(queryFileName, prettyQueryLog, {
                            mode: 'overwrite',
                            dirPath: queryDirPath,
                            editionId
                        })
                    }

                    const result = removeNull(await graphql(query))
                    data = result.data

                    logToFile(dataFileName, data, {
                        mode: 'overwrite',
                        dirPath: dataDirPath,
                        editionId
                    })
                }
                pageData = merge(pageData, data)
            }
        }
    }

    const finishedAt = new Date()
    const duration = finishedAt.getTime() - startedAt.getTime()

    console.log(`-> Done in ${duration}ms`)
    return pageData
}

// Instanciate with desired auth type (here's Bearer v2 auth)
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || '')

// Tell typescript it's a readonly app
const roClient = twitterClient.readOnly

export const getTwitterUser = async twitterName => {
    try {
        const data = await roClient.v2.userByUsername(twitterName, {
            'user.fields': ['public_metrics', 'profile_image_url', 'description']
        })
        const user = data && data.data
        return user
    } catch (error) {
        console.log(`// getTwitterUser error for ${twitterName}`)
        // console.log(error)
        if (error?.rateLimit) {
            console.log('// Rate Limit error')
            console.log(error.rateLimit)
            const resetTime = new Date(error.rateLimit.reset * 1000)
            console.log(resetTime)
        }
        console.log(error?.data)
        return
    }
}

export const sleep = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

export const getQuestionId = (id, facet) => (facet ? `${id}_by_${facet}` : id)

export function removeNull(obj) {
    var clean = Object.fromEntries(
        Object.entries(obj)
            .map(([k, v]) => [k, v === Object(v) ? removeNull(v) : v])
            .filter(([_, v]) => v != null && (v !== Object(v) || Object.keys(v).length))
    )
    return Array.isArray(obj) ? Object.values(clean) : clean
}

export const getCachingMethods = () => {
    let cacheLevel = { filesystem: true, api: true, redis: true }
    if (process.env.DISABLE_CACHE === 'true') {
        cacheLevel = { filesystem: false, api: false, redis: false }
    } else {
        if (process.env.DISABLE_FILESYSTEM_CACHE === 'true') {
            cacheLevel.filesystem = false
        }
        if (process.env.DISABLE_API_CACHE === 'true') {
            cacheLevel.api = false
        }
        if (process.env.DISABLE_REDIS_CACHE === 'true') {
            cacheLevel.redis = false
        }
    }
    return cacheLevel
}

export const getMetadata = async ({ surveyId, editionId, graphql }) => {
    const metadataQuery = getMetadataQuery({ surveyId, editionId })

    logToFile('metadataQuery.graphql', metadataQuery, {
        mode: 'overwrite',
        editionId
    })

    const metadataResults = removeNull(
        await graphql(
            `
                ${metadataQuery}
            `
        )
    )
    const metadataData = metadataResults?.data?.dataAPI
    logToFile('metadataData.json', metadataData, {
        mode: 'overwrite',
        editionId
    })
    const currentSurvey = metadataData.surveys[surveyId]._metadata
    const currentEdition = metadataData.surveys[surveyId][editionId]._metadata
    return { currentSurvey, currentEdition }
}
