/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { gql } from "graphql-request"

// gql
// It is there for convenience so that you can get the tooling support
// like prettier formatting and IDE syntax highlighting.
// You can use gql from graphql-tag if you need it for some reason too.
export default () => gql`
  {
    __type(name: "ServiceFilter") {
      name
      inputFields {
        name
        type {
          name
          kind
          ofType {
            name
            kind
            enumValues {
              name
            }
          }
        }
      }
    }
  }
`
