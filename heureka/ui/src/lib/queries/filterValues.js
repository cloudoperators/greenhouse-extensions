import { gql } from "graphql-request"

// Define the query to fetch filter values
export const GET_FILTER_VALUES = gql`
  query GetFilterValues($property: String!) {
    values(property: $property)
  }
`

// export const fetchFilterValues = ({ queryKey }) => {
//   const [_key, filterLabel, bearerToken, endpoint] = queryKey
//   const variables = { property: filterLabel }
//   return fetchFromAPI(bearerToken, endpoint, `/filters/values`, variables)
// }
