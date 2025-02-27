import { Survey, QuestionApiObject, SurveyApiObject, TypeDefTemplateOutput } from '../../types'
import { getFacetsTypeName } from '../../generate/helpers'

/*

Sample output:

enum StateOfJsFacets {
    language__proxies
    language__promise_all_settled
    language__dynamic_import
    language__nullish_coalescing
    language__optional_chaining
    language__private_fields
    # etc.
}

Note: when a question appears in different sections in different editions,
use the most recent section.

*/

export const generateFacetsType = ({
    survey,
    questionObjects
}: {
    survey: SurveyApiObject
    questionObjects: QuestionApiObject[]
}): TypeDefTemplateOutput => {
    const typeName = getFacetsTypeName(survey.id)
    const questionObjectsWithFilters = questionObjects.filter(
        q => typeof q.filterTypeName !== 'undefined' && q.surveyId === survey.id
    )
    return {
        generatedBy: 'facets',
        typeName,
        typeDef: `enum ${typeName} {
    ${questionObjectsWithFilters
        .sort((q1, q2) => q1?.sectionIds?.at(-1)?.localeCompare(q2?.sectionIds?.at(-1) ?? '') ?? 0)
        .sort((q1, q2) => (q1?.sectionIndex || 0) - (q2?.sectionIndex || 0))
        .map(q => `${q?.sectionIds?.at(-1)}__${q.id}`)
        .join('\n    ')}
}`
    }
}
