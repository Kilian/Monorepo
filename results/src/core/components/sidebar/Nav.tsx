import React from 'react'
import { useMatch } from '@reach/router'
import get from 'lodash/get'
import styled, { css } from 'styled-components'
import sitemap from 'Config/raw_sitemap.yml'
import { mq, fancyLinkMixin, spacing } from 'core/theme'
import { usePageContext } from 'core/helpers/pageContext'
import PageLink from 'core/pages/PageLink'
import LanguageSwitcher from 'core/i18n/LanguageSwitcher'
import { getPageLabelKey } from 'core/helpers/pageHelpers'
import T from 'core/i18n/T'
import { PageContextValue } from 'core/types'

interface PageConfig {
    is_hidden?: boolean
    id: string
}
const filteredNav =
    (sitemap as Array<PageConfig> | undefined)?.filter(page => !page.is_hidden) ?? []

const StyledPageLink = styled(PageLink)`
    display: flex;
    white-space: nowrap;
    margin: 0 0 ${spacing(0.33)} 0;
    font-size: ${props =>
        props.depth > 0
            ? props.theme.typography.size.smallish
            : props.theme.typography.size.medium};
    font-weight: ${props => (props.depth === 0 ? 800 : 400)};

    /* & > span {

        display: inline-block;
    } */

    @media ${mq.smallMedium} {
        margin-bottom: ${spacing(0.5)};
        display: block;
    }

    @media ${mq.large} {
        & > span {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: 100%;
            display: inline-block;
        }
        margin-left: ${props => (props.depth > 0 ? spacing() : 0)};
        ${props => {
            if (props.isHidden) {
                return css`
                    display: none;
                `
            }
        }}
    }

    &._is-active {
        span span::before {
            content: '> ';
        }

        @media ${mq.smallMedium} {
            span span::after {
                content: ' <';
            }
        }
    }

    ${props =>
        fancyLinkMixin({
            color: props.depth === 0 ? props.theme.colors.link : props.theme.colors.text,
            // activeColor: props.theme.colors.linkActive,
            activeColor: props.theme.colors.text
        })}
`

const NavItem = ({
    page,
    parentPage,
    currentPath,
    closeSidebar,
    isHidden = false,
    depth = 0
}: {
    page: PageContextValue
    parentPage?: PageContextValue
    currentPath: string
    closeSidebar: () => void
    isHidden?: boolean
    depth?: number
}) => {
    const isActive = currentPath.indexOf(page.path) !== -1
    // @ts-ignore
    const hasChildren = page.children && page.children.length > 0
    // @ts-ignore
    const displayChildren = hasChildren > 0 && isActive

    const match = useMatch(
        `${get(usePageContext(), 'locale.path')}${parentPage?.path ?? ''}${page.path}`
    )

    return (
        <>
            <StyledPageLink
                className={match ? '_is-active' : undefined}
                onClick={closeSidebar}
                page={page}
                depth={depth}
                isHidden={isHidden}
                parentPage={parentPage}
            >
                <T k={getPageLabelKey({ pageContext: page })} />
            </StyledPageLink>
            {hasChildren && (
                <>
                    {page.children.map(childPage => (
                        <NavItem
                            key={childPage.id}
                            parentPage={page}
                            page={childPage}
                            closeSidebar={closeSidebar}
                            currentPath={currentPath}
                            depth={depth + 1}
                            isHidden={!displayChildren}
                        />
                    ))}
                </>
            )}
        </>
    )
}

export const Nav = ({ closeSidebar }: { closeSidebar: () => void }) => {
    const context = usePageContext()

    return (
        <NavContainer>
            <LanguageSwitcherWrapper>
                <LanguageSwitcher />
            </LanguageSwitcherWrapper>
            {filteredNav.map((page: any, i: number) => (
                <NavItem
                    key={i}
                    page={page}
                    currentPath={context.currentPath}
                    closeSidebar={closeSidebar}
                />
            ))}
        </NavContainer>
    )
}

const NavContainer = styled.nav`
    flex-grow: 1;
    /* display: flex; */
    /* flex-direction: column; */
    padding: ${spacing(1.5)} ${spacing()};
    overflow-y: auto;

    @media ${mq.smallMedium} {
        align-items: center;
        overflow-y: scroll;
        overscroll-behavior: none;
    }
`

const LanguageSwitcherWrapper = styled.div`
    position: relative;
    width: 100%;
`
