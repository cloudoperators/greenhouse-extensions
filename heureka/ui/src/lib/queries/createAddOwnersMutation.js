/*import { gql } from "graphql-request"

// A function that dynamically generates a GraphQL mutation for adding multiple owners to a service
// As the graphql API offers no way to add multiple owners at once, we have to call addOwnerToService for each owner separately
export default (serviceId, userIds) => {
  const mutations = userIds.map(
    (userId, index) => `
    u${index}: addOwnerToService(serviceId: "${serviceId}", userId: "${userId}") {
      id
      name
      owners {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `
  )

  return gql`
    mutation {
      ${mutations.join("")}
    }
  `
}*/
import { gql } from "graphql-request"

// A function that dynamically generates a GraphQL mutation for adding multiple owners to a service
export default (serviceId, userIds) => {
  const variables = {}
  const mutations = userIds.map((userId, index) => {
    const variableName = `userId${index + 1}`
    variables[variableName] = userId

    return `u${
      index + 1
    }: addOwnerToService(serviceId: $serviceId, userId: $${variableName}) { id name owners { edges { node { id name } } } }`
  })

  // Remove any newlines or extra spaces and join mutations
  const mutation = `mutation ($serviceId: ID!, ${userIds
    .map((_, index) => `$userId${index + 1}: ID!`)
    .join(", ")}) {${mutations.join(" ")}}`
    .replace(/\s+/g, " ")
    .trim() // Remove newlines and excessive spaces
    .replace(/^\s*\n\s*/, "")
    .replace(/\n\s*$/, "")

  return {
    mutation: gql`
      ${mutation}
    `,
    variables: { serviceId, ...variables },
  }
}
