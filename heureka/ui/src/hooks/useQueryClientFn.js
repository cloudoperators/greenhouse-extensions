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
import ServiceFilterValuesQuery from "../lib/queries/serviceFilterValues"
import IssueMatchesFilterValuesQuery from "../lib/queries/issueMatchesFilterValues"
import componentsQuery from "../lib/queries/components"

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
    console.log("useQueryClientFn::: setting defaults")

    queryClient.setQueryDefaults(["services"], {
      queryFn: async ({ queryKey }) => {
        const [_key, options] = queryKey
        console.log("useQueryClientFn::: queryKey: ", queryKey, options)
        return await request(endpoint, servicesQuery(), options)
      },
    })

    queryClient.setQueryDefaults(["issues"], {
      queryFn: async ({ queryKey }) => {
        const [_key, options] = queryKey
        console.log("useQueryClientFn::: queryKey: ", queryKey, options)
        return await request(endpoint, issueMatchesQuery(), options)
      },
    })

    queryClient.setQueryDefaults(["components"], {
      queryFn: async ({ queryKey }) => {
        const [_key, options] = queryKey
        console.log("useQueryClientFn::: queryKey: ", queryKey)
        return await request(endpoint, componentsQuery(), options)
      },
    })

    queryClient.setQueryDefaults(["ServiceFilterValues"], {
      queryFn: async ({ queryKey, variables }) => {
        console.log("useQueryClientFn::: queryKey: ", queryKey)
        return await request(endpoint, ServiceFilterValuesQuery(), variables)
      },
      staleTime: Infinity, // this do not change often keep it until reload
    })

    queryClient.setQueryDefaults(["IssueMatchFilterValues"], {
      queryFn: async ({ queryKey, variables }) => {
        console.log("useQueryClientFn::: queryKey: ", queryKey)
        return await request(
          endpoint,
          IssueMatchesFilterValuesQuery(),
          variables
        )
      },
      staleTime: Infinity, // this do not change often keep it until reload
    })

    // set queryClientFnReady to true once
    setQueryClientFnReady(true)
  }, [queryClient, endpoint])
}

export default useQueryClientFn
