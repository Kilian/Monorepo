import React, { useMemo } from 'react'
import { ScaleBand } from 'd3'
import { BlockLegend } from 'core/types'
import { NO_ANSWER } from '@devographics/constants'
import { useI18n } from 'core/i18n/i18nContext'

type AxisBottomProps = {
    xScale: ScaleBand<string>
    legends: BlockLegend[]
    stroke: string
}

// tick length
const TICK_LENGTH = 6

export const AxisBottom = ({ xScale, legends, stroke }: AxisBottomProps) => {
    const { getString } = useI18n()
    const [min, max] = xScale.range()

    const ticks = useMemo(() => {
        return xScale.domain().map(value => ({
            value,
            xOffset: xScale(value)! + xScale.bandwidth() / 2
        }))
    }, [xScale])

    return (
        <>
            {/* Main horizontal line */}
            {/* <path
                d={['M', min + 20, 0, 'L', max - 20, 0].join(' ')}
                fill="none"
                stroke="currentColor"
            /> */}

            {/* Ticks and labels */}
            {ticks.map(({ value, xOffset }) => (
                <g key={value} transform={`translate(${xOffset}, 0)`}>
                    <line y2={TICK_LENGTH} stroke="#dddddd" strokeWidth="1" strokeOpacity="0.4" />
                    <text
                        key={value}
                        style={{
                            fill: stroke,
                            fontSize: '12px',
                            textAnchor: 'middle',
                            transform: 'translateY(20px)'
                        }}
                    >
                        {value === NO_ANSWER
                            ? getString('charts.no_answer')?.t
                            : legends.find(l => l.id === value)?.shortLabel}
                    </text>
                </g>
            ))}
        </>
    )
}
