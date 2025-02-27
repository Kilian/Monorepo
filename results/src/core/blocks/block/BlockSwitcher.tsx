import React, { useState } from 'react'
// import globalBlockRegistry from 'core/helpers/blockRegistry'
import blockRegistry from 'Config/blocks'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import { usePageContext } from 'core/helpers/pageContext'
import { BlockError } from 'core/blocks/block/BlockError'
import { getBlockData, getBlockSeriesData } from 'core/helpers/data'
import { BlockDefinition } from 'core/types'
import { CustomizationDefinition } from 'core/filters/types'

interface BlockSwitcherProps {
    block: BlockDefinition
}
const BlockSwitcher = ({ pageData, block, index, ...props }: BlockSwitcherProps) => {
    const pageContext = usePageContext()

    const { id, blockType, hidden } = block
    if (!blockRegistry[blockType]) {
        return (
            <BlockError
                block={block}
                message={`Missing Block Component! Block ID: ${id} | type: ${blockType}`}
            />
        )
    }
    const BlockComponent = blockRegistry[blockType]

    const { filtersState } = block

    const blockProps = {
        block,
        pageData,
        index,
        pageContext,
        // backwards-compatibility
        context: pageContext,
        BlockComponent
    }
    if (filtersState) {
        return <BlockSwitcherWithSeriesData {...blockProps} filtersState={filtersState} />
    } else {
        return <BlockSwitcherWithRegularData {...blockProps} />
    }
}

const BlockSwitcherWithSeriesData = (
    props: BlockSwitcherProps & { filtersState: CustomizationDefinition }
) => {
    const { block, pageData, BlockComponent, pageContext, filtersState } = props
    const { id, blockType } = block

    filtersState.options.preventQuery = true

    const series = getBlockSeriesData({ block, pageContext, filtersState })

    if (block.query && (!series || isEmpty(series) || series.length === 0 || !series[0].data)) {
        return (
            <BlockError
                block={block}
                message={`No available data for block ${id} | path(s): ${series
                    .map(s => s.dataPath)
                    .join(', ')} | type: ${blockType}`}
            >
                <textarea readOnly value={JSON.stringify(pageData, undefined, 2)} />
            </BlockError>
        )
    }

    return <BlockComponent series={series} {...props} />
}

const BlockSwitcherWithRegularData = (props: BlockSwitcherProps) => {
    const { block, pageData, BlockComponent, pageContext } = props
    const { id, blockType } = block
    const { dataPath, data } = getBlockData({ block, pageContext })

    if (block.query && (!data || data === null || isEmpty(data))) {
        return (
            <BlockError
                block={block}
                message={`No available data for block ${id} | path(s): ${dataPath} | type: ${blockType}`}
            >
                <textarea readOnly value={JSON.stringify(pageData, undefined, 2)} />
            </BlockError>
        )
    }

    return <BlockComponent data={data} {...props} />
}

export default BlockSwitcher
