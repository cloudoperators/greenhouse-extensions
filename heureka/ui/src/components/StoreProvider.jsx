import React, { createContext, useContext } from "react"
import { useStore as create } from "zustand"
import createStore from "../lib/store"

const StoreContext = createContext()
const StoreProvider = ({ options, children }) => (
  <StoreContext.Provider value={createStore(options)}>
    {children}
  </StoreContext.Provider>
)

const useStore = (selector) => create(useContext(StoreContext), selector)

export const useEndpoint = () => useStore((s) => s.endpoint)
export const useQueryClientFnReady = () => useStore((s) => s.queryClientFnReady)
export const useActiveTab = () => useStore((s) => s.activeTab)
export const useQueryOptions = (tab) =>
  useStore((s) => s.tabs[tab].queryOptions)
export const useActions = () => useStore((s) => s.actions)

// Filter exports
export const useFilterLabels = () => useStore((state) => state.filters.labels)
export const useActiveFilters = () =>
  useStore((state) => state.filters.activeFilters)
export const useSearchTerm = () => useStore((state) => state.filters.searchTerm)
export const useFilterLabelValues = () =>
  useStore((state) => state.filters.filterLabelValues)
export const useFilteredServices = () =>
  useStore((state) => state.filteredServices)
export const usePredefinedFilters = () =>
  useStore((state) => state.filters.predefinedFilters)
export const useActivePredefinedFilter = () =>
  useStore((state) => state.filters.activePredefinedFilter)

export default StoreProvider
