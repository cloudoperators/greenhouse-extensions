/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"

const initialFiltersState = {
  labels: {}, // Labels for each entity: { entityName: ["label1", "label2", ...] }
  activeFilters: {}, // Active filters for each entity: { entityName: { label1: [value1], label2: [value2_1, value2_2], ... } }
  filterLabelValues: {}, // Filter label values for each entity: { entityName: { label1: ["val1", "val2", ...], label2: [...] } }
  predefinedFilters: {}, // Predefined filters for each entity: { entityName: [{ name: "filter1", matchers: {"label1": "regex1", ...}}, ...] }
  activePredefinedFilter: {}, // Active predefined filter for each entity: { entityName: "filterName" }
  search: "", // Global search term used for full-text filtering: { entityName: ["searchTerm1", "searchTerm2", ...] }
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
