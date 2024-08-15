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
  query ($filter: IssueMatchFilter, $first: Int, $after: String) {
    IssueMatches(filter: $filter, first: $first, after: $after) {
      __typename
      totalCount
      edges {
        node {
          id
          status
          remediationDate
          discoveryDate
          targetRemediationDate
          severity {
            value
            score
          }
          effectiveIssueVariants {
            edges {
              node {
                id
                secondaryName
                description
              }
            }
          }
          evidences {
            totalCount
            edges {
              node {
                id
                description
              }
              cursor
            }
            pageInfo {
              hasNextPage
              nextPageAfter
            }
          }
          issueId
          issue {
            id
            primaryName
            lastModified
            type
          }
          componentInstanceId
          componentInstance {
            id
            ccrn
            count
            componentVersion {
              version
              component {
                name
              }
            }
            service {
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
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
          issueMatchChanges {
            totalCount
            edges {
              node {
                id
                action
                issueMatchId
                activityId
              }
              cursor
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
