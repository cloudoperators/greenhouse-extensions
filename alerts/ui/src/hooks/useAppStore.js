/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from "react"
import { createStore, useStore } from "zustand"
import { devtools } from "zustand/middleware"

import createSilencesSlice from "../lib/createSilencesSlice"
import createAlertsSlice from "../lib/createAlertsSlice"
import createFiltersSlice from "../lib/createFiltersSlice"
import createAuthDataSlice from "../lib/createAuthDataSlice"
import createGlobalsSlice from "../lib/createGlobalsSlice"
import createUserActivitySlice from "../lib/createUserActivitySlice"

const createAppStore = devtools((set, get) => ({
  ...createGlobalsSlice(set, get),
  ...createAuthDataSlice(set, get),
  ...createUserActivitySlice(set, get),
  ...createAlertsSlice(set, get),
  ...createFiltersSlice(set, get),
  ...createSilencesSlice(set, get),
}))

const StoreContext = createContext()

export const StoreProvider = ({ children }) => {
  return (
    <StoreContext.Provider
      value={createStore(
        devtools((set, get) => ({
          ...createGlobalsSlice(set, get),
          ...createAuthDataSlice(set, get),
          ...createUserActivitySlice(set, get),
          ...createAlertsSlice(set, get),
          ...createFiltersSlice(set, get),
          ...createSilencesSlice(set, get),
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
export const useShowDetailsFor = () =>
  useAppStore((state) => state.globals.showDetailsFor)
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

// Alert exports
export const useAlertsItems = () => useAppStore((state) => state.alerts.items)
export const useAlertsItemsFiltered = () =>
  useAppStore((state) => state.alerts.itemsFiltered)
export const useAlertsTotalCounts = () =>
  useAppStore((state) => state.alerts.totalCounts)
export const useAlertsSeverityCountsPerRegion = () =>
  useAppStore((state) => state.alerts.severityCountsPerRegion)
export const useAlertsRegions = () =>
  useAppStore((state) => state.alerts.regions)
export const useAlertsRegionsFiltered = () =>
  useAppStore((state) => state.alerts.regionsFiltered)
export const useAlertsIsLoading = () =>
  useAppStore((state) => state.alerts.isLoading)
export const useAlertsIsUpdating = () =>
  useAppStore((state) => state.alerts.isUpdating)
export const useAlertsUpdatedAt = () =>
  useAppStore((state) => state.alerts.updatedAt)
export const useAlertsError = () => useAppStore((state) => state.alerts.error)
export const useAlertEnrichedLabels = () =>
  useAppStore((state) => state.alerts.enrichedLabels)

export const useAlertsActions = () =>
  useAppStore((state) => state.alerts.actions)

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

// Silences exports
export const useSilencesItems = () =>
  useAppStore((state) => state.silences.items)
export const useSilencesItemsHash = () =>
  useAppStore((state) => state.silences.itemsHash)
export const useSilencesExcludedLabels = () =>
  useAppStore((state) => state.silences.excludedLabels)
export const useSilencesIsLoading = () =>
  useAppStore((state) => state.silences.isLoading)
export const useSilencesIsUpdating = () =>
  useAppStore((state) => state.silences.isUpdating)
export const useSilencesUpdatedAt = () =>
  useAppStore((state) => state.silences.updatedAt)
export const useSilencesError = () =>
  useAppStore((state) => state.silences.error)
export const useSilencesLocalItems = () =>
  useAppStore((state) => state.silences.localItems)

export const useSilencesActions = () =>
  useAppStore((state) => state.silences.actions)
