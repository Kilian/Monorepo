import { TemplateFunction, QuestionTemplateOutput } from '@devographics/types'
import range from 'lodash/range.js'

const groupBy = 10

const getBounds = (n: number) => [n === 0 ? 0 : n * groupBy + 1, (n + 1) * groupBy]

const getId = (n: number) => `range_${getBounds(n)[0]}_${getBounds(n)[1]}`

export const getOptions = () =>
    range(0, 100 / groupBy).map(n => ({
        id: getId(n),
        average: n * groupBy + groupBy / 2
    }))

export const knowledge_score: TemplateFunction = options => {
    const { question, section } = options
    const output: QuestionTemplateOutput = {
        id: 'knowledge_score',
        options: getOptions(),
        normPaths: {
            response: 'user_info.knowledge_score'
        },
        optionsAreSequential: true,
        optionsAreRange: true,
        ...question
    }
    return output
}
