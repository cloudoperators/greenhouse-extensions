/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useQuery } from "@tanstack/react-query"
import {
  services,
  serviceFilters,
  service,
  components,
  componentFilters,
  component,
  issues,
  issue,
  issueFilters,
  users,
  user,
  userFilters,
} from "./actions"

// get all services
export const getServices = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["services", bearerToken, endpoint, options],
    queryFn: services,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
  })
}

export const getServiceFilters = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["serviceFilters", bearerToken, endpoint, options],
    queryFn: serviceFilters,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
    // If a user leaves your application and returns to stale data, React Query automatically requests fresh data for you in the background.
    // You can disable this globally or per-query using the refetchOnWindowFocus option
    refetchOnWindowFocus: false,
  })
}

export const getService = (
  bearerToken,
  endpoint,
  serviceId,
  placeholderData
) => {
  return useQuery({
    queryKey: ["service", bearerToken, endpoint, serviceId],
    queryFn: service,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // Placeholder data allows a query to behave as if it already has data, similar to the initialData option,
    // but the data is not persisted to the cache. This comes in handy for situations where you have enough partial (or fake)
    // data to render the query successfully while the actual data is fetched in the background.
    placeholderData: placeholderData,
  })
}

// get all components
export const getComponents = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["components", bearerToken, endpoint, options],
    queryFn: components,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
  })
}

export const getComponentFilters = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["componentFilters", bearerToken, endpoint, options],
    queryFn: componentFilters,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
    // If a user leaves your application and returns to stale data, React Query automatically requests fresh data for you in the background.
    // You can disable this globally or per-query using the refetchOnWindowFocus option
    refetchOnWindowFocus: false,
  })
}

export const getComponent = (
  bearerToken,
  endpoint,
  componentId,
  placeholderData
) => {
  return useQuery({
    queryKey: ["component", bearerToken, endpoint, componentId],
    queryFn: component,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // Placeholder data allows a query to behave as if it already has data, similar to the initialData option,
    // but the data is not persisted to the cache. This comes in handy for situations where you have enough partial (or fake)
    // data to render the query successfully while the actual data is fetched in the background.
    placeholderData: placeholderData,
  })
}

export const getIssues = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["issues", bearerToken, endpoint, options],
    queryFn: issues,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
  })
}

export const getIssue = (bearerToken, endpoint, issueId, placeholderData) => {
  return useQuery({
    queryKey: ["user", bearerToken, endpoint, issueId],
    queryFn: issue,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // Placeholder data allows a query to behave as if it already has data, similar to the initialData option,
    // but the data is not persisted to the cache. This comes in handy for situations where you have enough partial (or fake)
    // data to render the query successfully while the actual data is fetched in the background.
    placeholderData: placeholderData,
  })
}

export const getIssueFilters = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["issueFilters", bearerToken, endpoint, options],
    queryFn: issueFilters,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
    // If a user leaves your application and returns to stale data, React Query automatically requests fresh data for you in the background.
    // You can disable this globally or per-query using the refetchOnWindowFocus option
    refetchOnWindowFocus: false,
  })
}

export const getUsers = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["users", bearerToken, endpoint, options],
    queryFn: users,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
  })
}

export const getUser = (bearerToken, endpoint, userId, placeholderData) => {
  return useQuery({
    queryKey: ["user", bearerToken, endpoint, userId],
    queryFn: user,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // Placeholder data allows a query to behave as if it already has data, similar to the initialData option,
    // but the data is not persisted to the cache. This comes in handy for situations where you have enough partial (or fake)
    // data to render the query successfully while the actual data is fetched in the background.
    placeholderData: placeholderData,
  })
}

export const getUserFilters = (bearerToken, endpoint, options) => {
  return useQuery({
    queryKey: ["userFilters", endpoint, options],
    queryFn: userFilters,
    // The query will not execute until the bearerToken exists
    enabled: !!bearerToken,
    // The data from the last successful fetch available while new data is being requested, even though the query key has changed.
    // When the new data arrives, the previous data is seamlessly swapped to show the new data.
    // isPreviousData is made available to know what data the query is currently providing you
    keepPreviousData: true,
    // If a user leaves your application and returns to stale data, React Query automatically requests fresh data for you in the background.
    // You can disable this globally or per-query using the refetchOnWindowFocus option
    refetchOnWindowFocus: false,
  })
}
