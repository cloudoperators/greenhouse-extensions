/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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

  return {
    mutation: gql`
      ${mutation}
    `,
    variables: { serviceId, ...variables },
  }
}
