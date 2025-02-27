import { TemplateFunction, QuestionTemplateOutput } from '@devographics/types'
import { getOptions } from './knowledge_score'

export const reading_list: TemplateFunction = options => {
    const { question } = options
    const output: QuestionTemplateOutput = {
        id: 'reading_list',
        normPaths: {
            response: 'reading_list'
        },
        ...question
    }
    return output
}
