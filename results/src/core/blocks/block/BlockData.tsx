import React from 'react'
import styled from 'styled-components'
import Table from '../table/Table'
import ModalTrigger from 'core/components/ModalTrigger'
import Button from 'core/components/Button'
import T from 'core/i18n/T'
import { mq, spacing, fontSize } from 'core/theme'
import { getFiltersQuery } from 'core/filters/helpers'
import { usePageContext } from 'core/helpers/pageContext'
import { getBlockQuery } from 'core/helpers/queries'

import { parse } from 'graphql'
import { print } from 'graphql-print'

const BlockData = props => {
    const { block, chartFilters, tables } = props
    const { parameters } = block
    const pageContext = usePageContext()

    const query = chartFilters
        ? getFiltersQuery({
              block,
              pageContext,
              chartFilters,
              currentYear: pageContext.currentEdition.year
          })?.query
        : getBlockQuery({
              block,
              pageContext,
              queryOptions: {
                  addArgumentsPlaceholder: false,
                  addBucketFacetsPlaceholder: false
              },
              queryArgs: parameters ? { parameters } : {}
          })

    return (
        <>
            <ExportWrapper>
                <JSONTrigger {...props} />
                <GraphQLTrigger query={query} />
            </ExportWrapper>
            {tables ? (
                <Table {...props} />
            ) : (
                <p>
                    <T k="table.not_available" />
                </p>
            )}
        </>
    )
}

export const JSONTrigger = props => (
    <ModalTrigger
        trigger={
            <ExportButton className="ExportButton" size="small" {...props.buttonProps}>
                <T k="export.export_json" />
                {/* <ExportIcon /> */}
            </ExportButton>
        }
    >
        <JSONExport {...props} />
    </ModalTrigger>
)

export const GraphQLTrigger = props => {
    const { query, buttonProps = {} } = props
    return (
        <ModalTrigger
            trigger={
                <ExportButton className="ExportButton" size="small" {...buttonProps}>
                    <T k="export.export_graphql" />
                    {/* <ExportIcon /> */}
                </ExportButton>
            }
        >
            <GraphQLExport query={query} />
        </ModalTrigger>
    )
}

export function removeNull(obj: any): any {
    if (!obj) return
    const clean = Object.fromEntries(
        Object.entries(obj)
            .map(([k, v]) => [k, v === Object(v) ? removeNull(v) : v])
            .filter(([_, v]) => v != null && (v !== Object(v) || Object.keys(v).length))
    )
    return Array.isArray(obj) ? Object.values(clean) : clean
}

export const JSONExport = ({ block, data }) => {
    const isArray = Array.isArray(data)

    // try to remove entities data
    const cleanedData = removeNull(
        isArray
            ? data.map(row => {
                  const { entity, ...rest } = row
                  return rest
              })
            : data
    )

    const jsonExport = JSON.stringify(cleanedData, '', 2)

    return (
        <div>
            <AutoSelectText value={jsonExport} />
        </div>
    )
}

export const GraphQLExport = ({ query }: { query: string }) => {
    let stringQuery = query
    try {
        const ast = parse(query)
        stringQuery = print(ast, { preserveComments: true })
    } catch (error) {
        console.warn(error)
        console.warn(stringQuery)
    }
    return (
        <div>
            <AutoSelectText value={stringQuery} />
            <Message_>
                <T k={'export.graphql'} html={true} />
            </Message_>
        </div>
    )
}

const ExportWrapper = styled.div`
    margin-bottom: ${spacing()};
    display: flex;
    flex-wrap: wrap;
    gap: ${spacing(0.5)};
`

export const ExportButton = styled(Button)`
    display: inline;
    margin: 0;
`

export const AutoSelectText = ({ value }) => {
    const text = React.createRef()
    const handleClick = () => {
        text.current.select()
    }
    return <TextArea value={value} readOnly ref={text} onClick={handleClick} />
}

export const Message_ = styled.div`
    margin-top: ${spacing(0.5)};
    font-size: ${fontSize('small')};
`

export const TextArea = styled.textarea`
    width: 100%;
    font-size: ${fontSize('small')};
    padding: ${spacing(0.5)};
    border: 0;
    border-radius: 2px;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};

    &:focus {
        outline: 0;
    }

    @media ${mq.small} {
        height: 150px;
    }
    @media ${mq.mediumLarge} {
        height: ${({ size }) => (size === 's' ? '150px' : '400px')};
    }
`

export default BlockData
