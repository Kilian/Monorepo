import { graphqlize } from '../../generate/helpers'
import { SurveyApiObject, TypeDefTemplateOutput } from '../../types'

/*

Sample output:

type Surveys {
    metadata: SurveyMetadata
    demo_survey: DemoSurveySurvey
    state_of_css: StateOfCssSurvey
    state_of_graphql: StateOfGraphqlSurvey
    state_of_js: StateOfJsSurvey
}
*/

export const getResponseTypeName = (surveyId: string) => `${graphqlize(surveyId)}Responses`

export const generateResponsesType = ({
    survey,
    path
}: {
    survey: SurveyApiObject
    path: string
}): TypeDefTemplateOutput => {
    const typeName = getResponseTypeName(survey.id)
    return {
        generatedBy: 'responses',
        path,
        typeName,
        typeDef: `type ${typeName} {
    allEditions: [ResponseEditionData]
    currentEdition: ResponseEditionData
}`
    }
}
