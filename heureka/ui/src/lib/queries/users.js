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
  query ($filter: UserFilter, $first: Int, $after: String) {
    Users(filter: $filter, first: $first, after: $after) {
      __typename
      totalCount
      edges {
        node {
          id
          uniqueUserId
          name
        }
        cursor
      }
    }
  }
`
