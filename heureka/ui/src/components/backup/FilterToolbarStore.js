/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import uniqueId from "lodash.uniqueid"
import { createStore, useStore as useZustandStore } from "zustand"
import React, { createContext, useContext, useRef } from "react"

const StoreContext = createContext()

export const SEARCH_STRING_TYPE = "string"
export const SEARCH_BOOL_TYPE = "bool"
export const SEARCH_ARRAY_TYPE = "[string]"

// custom store for the selected filters
const initialStore = (filterTypes) => {
  return createStore((set) => ({
    filterTypes: filterTypes || {},
    filters: [], // this is the initial state
    addFilter: (key, value) => addFilter(set, key, value),
    removeFilter: (key, value) => removeFilter(set, key, value),
  }))
}

const addFilter = (set, key, value) =>
  set((state) => {
    // prevent to add duplicates
    const index = state.filters.findIndex(
      (item) => item.key === key && item.value === value
    )
    if (index >= 0) return state

    // if key type is string or boolean do not add more than 1 filter, overwrite existing
    if (
      state.filterTypes[key] === SEARCH_STRING_TYPE ||
      state.filterTypes[key] === SEARCH_BOOL_TYPE
    ) {
      const newFilters = state.filters.slice()
      const foundItem = newFilters.find((element) => element.key === key)
      if (foundItem) {
        foundItem.value = value
        return { ...state, filters: newFilters }
      }
    }
    // add entry
    let newFilters = state.filters
      .slice()
      .concat({ uid: uniqueId("filter-"), key: key, value: value })
    // sort entries
    newFilters.sort((a, b) => a.key.localeCompare(b.key))
    return { ...state, filters: newFilters }
  })

const removeFilter = (set, uid) =>
  set((state) => {
    let newItems = state.filters.slice()
    const index = newItems.findIndex((item) => item.uid === uid)
    // if NOT found return
    if (index < 0) return state

    newItems.splice(index, 1)
    return { ...state, filters: newItems }
  })

export const FilterToolbarStateProvider = ({ filterTypes, children }) => {
  const store = useRef(initialStore(filterTypes)).current
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

const useStore = (selector) => {
  const store = useContext(StoreContext)
  return useZustandStore(store, selector)
}
export { useStore }
