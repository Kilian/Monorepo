import {
    DbPaths,
    QuestionTemplateOutput,
    TemplateFunction,
    DbSuffixes,
    DbPathsEnum
} from '@devographics/types'
import { checkHasId } from '../helpers'

export const projects: TemplateFunction = options => {
    const { edition, section } = options
    const question = checkHasId(options)

    const sectionSegment = section.template === 'tool' ? 'tools_others' : section.slug || section.id
    const questionSegment = question?.id?.replace('_prenormalized', '').replace('_others', '')

    const basePath = `${sectionSegment}.${questionSegment}.${DbSuffixes.OTHERS}`

    const rawPaths: DbPaths = {
        [DbPathsEnum.RESPONSE]: `${sectionSegment}__${questionSegment}__${DbSuffixes.PRENORMALIZED}`,
        [DbPathsEnum.PRENORMALIZED]: `${sectionSegment}__${questionSegment}__${DbSuffixes.PRENORMALIZED}`
    }

    const normPaths: DbPaths = {
        [DbPathsEnum.BASE]: basePath,
        [DbPathsEnum.RAW]: `${basePath}.${DbSuffixes.RAW}`,
        [DbPathsEnum.PATTERNS]: `${basePath}.${DbSuffixes.PATTERNS}`,
        [DbPathsEnum.ERROR]: `${basePath}.${DbSuffixes.ERROR}`,
        [DbPathsEnum.PRENORMALIZED]: `${basePath}.${DbSuffixes.NORMALIZED}`
    }

    const output: QuestionTemplateOutput = {
        rawPaths,
        normPaths,
        allowMultiple: true,
        ...question
    }
    return output
}
