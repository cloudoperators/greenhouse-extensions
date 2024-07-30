import { gql } from "graphql-request"

// gql
// It is there for convenience so that you can get the tooling support
// like prettier formatting and IDE syntax highlighting.
// You can use gql from graphql-tag if you need it for some reason too.
export default () => gql`
  query ($filter: ComponentFilter, $first: Int, $after: String) {
    Components(filter: $filter, first: $first, after: $after) {
      totalCount
      edges {
        node {
          id
          name
          type
        }
        cursor
      }
    }
  }
`
