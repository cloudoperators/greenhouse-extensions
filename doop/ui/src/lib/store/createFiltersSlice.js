/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const createFiltersSlice = (set, get) => ({
  filters: {
    searchTerm: null,
    active: undefined,

    actions: {
      set: (filters) => {
        if (!Array.isArray(filters)) return
        set(
          (state) => ({ filters: { ...state.filters, active: filters } }),
          false,
          "filters.set"
        )
        // filter items
        get().data.actions.filterItems()
      },
      add: (key, value) => {
        set(
          (state) => {
            let activeFilters = state.filters.active?.slice() || []
            let index = activeFilters.findIndex(
              (f) => f.key === key && f.value === value
            )
            if (index < 0) activeFilters.push({ key: key, value: value })
            return { filters: { ...state.filters, active: activeFilters } }
          },
          false,
          "filters.add"
        )
        // filter items
        get().data.actions.filterItems()
      },
      remove: (key, value) => {
        set(
          (state) => {
            let activeFilters = state.filters.active?.slice() || []
            let index = activeFilters.findIndex(
              (f) => f.key === key && f.value === value
            )
            if (index >= 0) activeFilters.splice(index, 1)
            return { filters: { ...state.filters, active: activeFilters } }
          },
          false,
          "filters.remove"
        )
        // filter items
        get().data.actions.filterItems()
      },
      removeAll: () => {
        set(
          (state) => ({ filters: { ...state.filters, active: [] } }),
          false,
          "filters.remove"
        )
        // filter items
        get().data.actions.filterItems()
      },
      setSearchTerm: (searchTerm) => {
        set((state) => ({ filters: { ...state.filters, searchTerm } }))
        // filter items
        get().data.actions.filterItems()
      },
    },
  },
})

export default createFiltersSlice
