/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { gql } from "graphql-request"

// gql
// It is there for convenience so that you can get the tooling support
// like prettier formatting and IDE syntax highlighting.
// You can use gql from graphql-tag if you need it for some reason too.
export default () => gql`
  query ($filter: ServiceFilter, $first: Int, $after: String) {
    Services(filter: $filter, first: $first, after: $after) {
      __typename
      totalCount
      edges {
        node {
          id
          name
          owners {
            totalCount
            edges {
              node {
                id
                uniqueUserId
                name
              }
              cursor
            }
            pageInfo {
              hasNextPage
              nextPageAfter
            }
          }
          supportGroups {
            totalCount
            edges {
              node {
                id
                name
              }
              cursor
            }
            pageInfo {
              hasNextPage
              nextPageAfter
            }
          }
          activities {
            totalCount
            edges {
              node {
                id
              }
              cursor
            }
            pageInfo {
              hasNextPage
              nextPageAfter
            }
          }
          componentInstances {
            edges {
              node {
                id
                ccrn
                count
                componentVersion {
                  version
                  component {
                    name
                  }
                }
                issueMatches {
                  totalCount
                  edges {
                    node {
                      id
                      severity {
                        value
                        score
                      }
                      issue {
                        id
                        primaryName
                      }
                    }
                  }
                }
              }
            }
          }
          issueRepositories {
            totalCount
            edges {
              node {
                id
                name
                url
                created_at
                updated_at
              }
              cursor
              priority
              created_at
              updated_at
            }
            pageInfo {
              hasNextPage
              nextPageAfter
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        isValidPage
        pageNumber
        nextPageAfter
        pages {
          after
          isCurrent
          pageNumber
          pageCount
        }
      }
    }
  }
`
