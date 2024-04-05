/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from "react"
import { useStore as create } from "zustand"
import createStore from "../lib/store"

const StoreContext = createContext()
const StoreProvider = ({ children }) => (
  <StoreContext.Provider value={createStore()}>
    {children}
  </StoreContext.Provider>
)

const useStore = (selector) => create(useContext(StoreContext), selector)

// globals
export const useGlobalsMock = () => useStore((s) => s.globals.isMock)
export const useGlobalsEndpoint = () => useStore((s) => s.globals.endpoint)
export const useGlobalsActions = () => useStore((s) => s.globals.actions)

// auth
export const useAuthData = () => useStore((s) => s.auth.data)
export const useAuthIsProcessing = () => useStore((s) => s.auth.isProcessing)
export const useAuthLoggedIn = () => useStore((s) => s.auth.loggedIn)
export const useAuthError = () => useStore((s) => s.auth.error)
export const useAuthLastAction = () => useStore((s) => s.auth.lastAction)
export const useAuthAppLoaded = () => useStore((s) => s.auth.appLoaded)
export const useAuthAppIsLoading = () => useStore((s) => s.auth.appIsLoading)
export const useAuthActions = () => useStore((s) => s.auth.actions)

// user activity
export const useUserActivityIsActive = () =>
  useStore((s) => s.userActivity.isActive)
export const useUserActivityActions = () =>
  useStore((s) => s.userActivity.actions)

// data
export const useDataLoaded = () => useStore((s) => s.data.loaded)
export const useDataClusterIdentities = () =>
  useStore((s) => s.data.clusterIdentities)
export const useDataViolationGroups = () =>
  useStore((s) => s.data.violationGroups)
export const useDataDetailsViolationGroupKind = () =>
  useStore((s) => s.data.detailsViolationGroupKind)
export const useDataDetailsViolationGroup = () =>
  useStore((s) => s.data.detailsViolationGroup)
export const useDataSeverityWeights = () =>
  useStore((s) => s.data.severityWeights)
export const useDataFilterEntries = () => useStore((s) => s.data.filterEntries)
export const useDataFilteredItems = () => useStore((s) => s.data.filteredItems)
export const useDataActions = () => useStore((s) => s.data.actions)

// filters
export const useFiltersActive = () => useStore((s) => s.filters.active)
export const useFiltersSearchTerm = () => useStore((s) => s.filters.searchTerm)
export const useFiltersActions = () => useStore((s) => s.filters.actions)

export default StoreProvider

export const ACTIONS = {
  SIGN_ON: "signOn",
  SIGN_OUT: "signOut",
}
