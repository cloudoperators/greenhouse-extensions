/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useGlobalsApiEndpoint, useGlobalsActions } from "./useAppStore"
import { request } from "graphql-request"
import servicesQuery from "../lib/queries/services"
import issueMatchesQuery from "../lib/queries/issueMatches"
import serviceFilterValuesQuery from "../lib/queries/serviceFilterValues"
import issueMatchesFilterValuesQuery from "../lib/queries/issueMatchesFilterValues"
import componentsQuery from "../lib/queries/components"
import addRemoveServiceOwners from "../lib/queries/addRemoveServiceOwners"
import usersQuery from "../lib/queries/users"

// hook to register query defaults that depends on the queryClient and options
const useQueryClientFn = () => {
  const queryClient = useQueryClient()
  const endpoint = useGlobalsApiEndpoint()
  const { setQueryClientFnReady } = useGlobalsActions()
  /*
  As stated in getQueryDefaults, the order of registration of query defaults does matter. Since the first matching defaults are returned by getQueryDefaults, the registration should be made in the following order: from the least generic key to the most generic one. This way, in case of specific key, the first matching one would be the expected one.
  */
  useEffect(() => {
    if (!queryClient || !endpoint) return

    queryClient.setQueryDefaults(["Services"], {
      queryFn: async ({ queryKey }) => {
        const [_key, options] = queryKey
        return await request(endpoint, servicesQuery(), options)
      },
    })

    queryClient.setQueryDefaults(["IssueMatches"], {
      queryFn: async ({ queryKey }) => {
        const [_key, options] = queryKey
        return await request(endpoint, issueMatchesQuery(), options)
      },
    })

    queryClient.setQueryDefaults(["Components"], {
      queryFn: async ({ queryKey }) => {
        const [_key, options] = queryKey
        return await request(endpoint, componentsQuery(), options)
      },
    })

    queryClient.setQueryDefaults(["ServiceFilterValues"], {
      queryFn: async ({ queryKey, variables }) => {
        return await request(endpoint, serviceFilterValuesQuery(), variables)
      },
      staleTime: Infinity, // this do not change often keep it until reload
    })

    queryClient.setQueryDefaults(["IssueMatchFilterValues"], {
      queryFn: async ({ queryKey, variables }) => {
        return await request(
          endpoint,
          issueMatchesFilterValuesQuery(),
          variables
        )
      },
      staleTime: Infinity, // this do not change often keep it until reload
    })

    queryClient.setQueryDefaults(["Users"], {
      queryFn: async ({ queryKey }) => {
        const [_key, options] = queryKey
        return await request(endpoint, usersQuery(), options)
      },
    })

    // Set mutation defaults for addOwnerToService
    queryClient.setMutationDefaults(["addOwnerToService"], {
      mutationFn: async ({ serviceId, userId }) => {
        const { mutation, variables } = addRemoveServiceOwners(
          serviceId,
          userId,
          "add" // Specify "add" action for adding a user
        )
        await request(endpoint, mutation, variables)
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["Services"])
      },
      onError: (error) => {
        console.error("Failed to add owner to the service:", error)
      },
    })

    // Set mutation defaults for removeOwnerFromService
    queryClient.setMutationDefaults(["removeOwnerFromService"], {
      mutationFn: async ({ serviceId, userId }) => {
        const { mutation, variables } = addRemoveServiceOwners(
          serviceId,
          userId,
          "remove" // Specify "remove" action for removing a user
        )
        await request(endpoint, mutation, variables)
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["Services"])
      },
      onError: (error) => {
        console.error("Failed to remove owner from the service:", error)
      },
    })

    // Set queryClientFnReady to true once
    setQueryClientFnReady(true)
  }, [queryClient, endpoint])
}

export default useQueryClientFn
