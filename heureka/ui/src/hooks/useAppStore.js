/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from "react"
import { createStore, useStore } from "zustand"
import { devtools } from "zustand/middleware"

import createFiltersSlice from "../lib/slices/createFiltersSlice"
import createAuthDataSlice from "../lib/slices/createAuthDataSlice"
import createGlobalsSlice from "../lib/slices/createGlobalsSlice"
import createUserActivitySlice from "../lib/slices/createUserActivitySlice"

const createAppStore = devtools((set, get) => ({
  ...createGlobalsSlice(set, get),
  ...createAuthDataSlice(set, get),
  ...createUserActivitySlice(set, get),
  ...createFiltersSlice(set, get),
}))

const StoreContext = createContext()

export const StoreProvider = ({ options, children }) => {
  return (
    <StoreContext.Provider
      value={createStore(
        devtools((set, get) => ({
          ...createGlobalsSlice(set, get, options),
          ...createAuthDataSlice(set, get),
          ...createUserActivitySlice(set, get),
          ...createFiltersSlice(set, get),
        }))
      )}
    >
      {children}
    </StoreContext.Provider>
  )
}

const useAppStore = (selector) => useStore(useContext(StoreContext), selector)

// atomic exports only instead of exporting whole store
// See reasoning here: https://tkdodo.eu/blog/working-with-zustand

// Globals exports
export const useGlobalsEmbedded = () =>
  useAppStore((state) => state.globals.embedded)
export const useGlobalsQueryClientFnReady = () =>
  useAppStore((state) => state.globals.queryClientFnReady)
export const useGlobalsActiveTab = () =>
  useAppStore((state) => state.globals.activeTab)
export const useGlobalsQueryOptions = (tab) =>
  useAppStore((state) => state.globals.tabs[tab].queryOptions)
export const useGlobalsApiEndpoint = () =>
  useAppStore((state) => state.globals.apiEndpoint)
export const useGlobalsActions = () =>
  useAppStore((state) => state.globals.actions)

// AUTH
export const useAuthData = () => useAppStore((state) => state.auth.data)
export const useAuthIsProcessing = () =>
  useAppStore((state) => state.auth.isProcessing)
export const useAuthLoggedIn = () => useAppStore((state) => state.auth.loggedIn)
export const useAuthError = () => useAppStore((state) => state.auth.error)
export const useAuthLastAction = () =>
  useAppStore((state) => state.auth.lastAction)
export const useAuthAppLoaded = () =>
  useAppStore((state) => state.auth.appLoaded)
export const useAuthAppIsLoading = () =>
  useAppStore((state) => state.auth.appIsLoading)
export const useAuthActions = () => useAppStore((state) => state.auth.actions)

// UserActivity exports
export const useUserIsActive = () =>
  useAppStore((state) => state.userActivity.isActive)

export const useUserActivityActions = () =>
  useAppStore((state) => state.userActivity.actions)

// Filter exports
export const useFilterLabels = () =>
  useAppStore((state) => state.filters.labels)
export const useActiveFilters = () =>
  useAppStore((state) => state.filters.activeFilters)
export const useSearchTerm = () =>
  useAppStore((state) => state.filters.searchTerm)
export const useFilterLabelValues = () =>
  useAppStore((state) => state.filters.filterLabelValues)
export const usePredefinedFilters = () =>
  useAppStore((state) => state.filters.predefinedFilters)
export const useActivePredefinedFilter = () =>
  useAppStore((state) => state.filters.activePredefinedFilter)

export const useFilterActions = () =>
  useAppStore((state) => state.filters.actions)
