/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce, current } from "immer"

const initialFiltersState = {
  labels: {}, // Labels for each entity: { entityName: ["label1", "label2", ...] }
  activeFilters: {}, // Active filters for each entity: { entityName: { label1: [value1], label2: [value2_1, value2_2], ... } }
  filterLabelValues: {}, // Filter label values for each entity: { entityName: { label1: ["val1", "val2", ...], label2: [...] } }
  predefinedFilters: {}, // Predefined filters for each entity: { entityName: [{ name: "filter1", matchers: {"label1": "regex1", ...}}, ...] }
  activePredefinedFilter: {}, // Active predefined filter for each entity: { entityName: "filterName" }
  search: "", // Global search term used for full-text filtering
}

const createFiltersSlice = (set, get) => ({
  filters: {
    ...initialFiltersState,
    actions: {
      setLabels: (entityName, labels) =>
        set(
          produce((state) => {
            state.filters.labels[entityName] = labels
          }),
          false,
          "filters.setLabels"
        ),

      setFilterLabelValues: (entityName, filters) =>
        set(
          produce((state) => {
            state.filters.filterLabelValues[entityName] = filters.reduce(
              (acc, filter) => {
                acc[filter.label] = filter.values
                return acc
              },
              {}
            )
          }),
          false,
          "filters.setFilterLabelValues"
        ),

      setActiveFilters: (entityName, activeFilters) => {
        set(
          produce((state) => {
            state.filters.activeFilters[entityName] = activeFilters
          }),
          false,
          "filters.setActiveFilters"
        )
      },

      clearActiveFilters: (entityName) => {
        set(
          produce((state) => {
            state.filters.activeFilters[entityName] = {}
          }),
          false,
          "filters.clearActiveFilters"
        )
      },

      addActiveFilter: (entityName, filterLabel, filterValue) => {
        set(
          produce((state) => {
            if (!state.filters.activeFilters[entityName]) {
              state.filters.activeFilters[entityName] = {}
            }

            if (!state.filters.activeFilters[entityName][filterLabel]) {
              state.filters.activeFilters[entityName][filterLabel] = []
            }

            // Add the filter value if it doesn't already exist
            state.filters.activeFilters[entityName][filterLabel] = [
              ...new Set([
                ...state.filters.activeFilters[entityName][filterLabel],
                filterValue,
              ]),
            ]
          }),
          false,
          "filters.addActiveFilter"
        )
      },

      addActiveFilters: (entityName, filterLabel, filterValues) => {
        set(
          produce((state) => {
            if (!state.filters.activeFilters[entityName]) {
              state.filters.activeFilters[entityName] = {}
            }

            if (!state.filters.activeFilters[entityName][filterLabel]) {
              state.filters.activeFilters[entityName][filterLabel] = []
            }

            // Add the filter values and ensure uniqueness
            state.filters.activeFilters[entityName][filterLabel] = [
              ...new Set([
                ...state.filters.activeFilters[entityName][filterLabel],
                ...filterValues,
              ]),
            ]
          }),
          false,
          "filters.addActiveFilters"
        )
      },

      removeActiveFilter: (entityName, filterLabel, filterValue) => {
        set(
          produce((state) => {
            const updatedFilters = state.filters.activeFilters[entityName][
              filterLabel
            ].filter((value) => value !== filterValue)

            if (updatedFilters.length === 0) {
              delete state.filters.activeFilters[entityName][filterLabel]
            } else {
              state.filters.activeFilters[entityName][filterLabel] =
                updatedFilters
            }
          }),
          false,
          "filters.removeActiveFilter"
        )
      },

      setActivePredefinedFilter: (entityName, filterName) => {
        set(
          produce((state) => {
            state.filters.activePredefinedFilter[entityName] = filterName
          }),
          false,
          "filters.setActivePredefinedFilter"
        )
      },

      clearActivePredefinedFilter: (entityName) => {
        set(
          produce((state) => {
            state.filters.activePredefinedFilter[entityName] = null
          }),
          false,
          "filters.clearActivePredefinedFilter"
        )
      },

      togglePredefinedFilter: (entityName, filterName) => {
        set(
          produce((state) => {
            if (
              state.filters.activePredefinedFilter[entityName] === filterName
            ) {
              state.filters.activePredefinedFilter[entityName] = null
            } else {
              state.filters.activePredefinedFilter[entityName] = filterName
            }
          }),
          false,
          "filters.togglePredefinedFilter"
        )
      },

      loadFilterLabelValues: (entityName, filterLabel) => {
        set(
          produce((state) => {
            if (!state.filters.filterLabelValues[entityName]) {
              state.filters.filterLabelValues[entityName] = {}
            }
            state.filters.filterLabelValues[entityName][filterLabel] = {
              isLoading: true,
            }
          }),
          false,
          "filters.loadFilterLabelValues.isLoading"
        )

        // Simulate a data fetch and update the state
        set(
          produce((state) => {
            const values = [
              ...new Set(
                state.services.items.map((item) => item.labels[filterLabel])
              ),
            ]
            state.filters.filterLabelValues[entityName][filterLabel].values =
              values
                .filter((value) => value)
                .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

            state.filters.filterLabelValues[entityName][
              filterLabel
            ].isLoading = false
          }),
          false,
          "filters.loadFilterLabelValues"
        )
      },

      reloadFilterLabelValues: (entityName) => {
        const currentLabels = Object.keys(
          get().filters.filterLabelValues[entityName] || {}
        )

        currentLabels.forEach((label) => {
          get().filters.actions.loadFilterLabelValues(entityName, label)
        })
      },

      setSearchTerm: (entityName, searchTerm) =>
        set(
          (state) => ({
            filters: {
              ...state.filters,
              search: {
                ...state.filters.search,
                [entityName]: searchTerm, // Set search term per entityName
              },
            },
          }),
          false,
          "filters.setSearchTerm"
        ),
    },
  },
})

export default createFiltersSlice
