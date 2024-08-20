/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"

const initialFiltersState = {
  labels: ["status"], // labels to be used for filtering: [ "label1", "label2", "label3"]. Default is status which is enriched by the worker
  activeFilters: {}, // for each active filter key list the selected values: {key1: [value1], key2: [value2_1, value2_2], ...}
  pausedFilters: {}, // inactive subset of activeFilters.
  filterLabelValues: {}, // contains all possible values for filter labels: {label1: ["val1", "val2", "val3", ...], label2: [...]}, lazy loaded when a label is selected for filtering
  predefinedFilters: [], // predefined complex filters that filter using regex: [{name: "filter1", displayName: "Filter 1", matchers: {"label1": "regex1", "label2": "regex2", ...}}, ...]
  activePredefinedFilter: null, // the currently active predefined filter
  searchTerm: "", // the search term used for full-text filtering
  filterPills: {}, // Collection of active and inactive filterPills which are shown in the UI. {"label1":[{"value":"val1","active":true},{"value":"val2","active":true}], ,"label2":[{"value":"value3","active":false}]}
}

const createFiltersSlice = (set, get) => ({
  filters: {
    ...initialFiltersState,
    actions: {
      setLabels: (labels) =>
        set(
          (state) => {
            if (!labels) return state

            // check if labels is an array
            if (!Array.isArray(labels)) {
              console.warn(
                "[supernova]::setLabels: labels object is not an array"
              )
              return state
            }

            // check if all elements in the array are strings delete the ones that are not
            if (!labels.every((element) => typeof element === "string")) {
              console.warn(
                "[supernova]::setLabels: Some elements of the array are not strings."
              )
              labels = labels.filter((element) => typeof element === "string")
            }

            // merge given labels with the initial, make it unique and sort it alphabetically
            const uniqueLabels = Array.from(
              new Set(initialFiltersState.labels.concat(labels))
            ).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

            return {
              filters: {
                ...state.filters,
                labels: uniqueLabels,
              },
            }
          },
          false,
          "filters.setLabels"
        ),

      setActiveFilters: (activeFilters) => {
        set(
          (state) => {
            return {
              filters: {
                ...state.filters,
                activeFilters,
              },
            }
          },
          false,
          "filters.setActiveFilters"
        )
        get().alerts.actions.filterItems()
      },

      clearFilters: () => {
        set(
          produce((state) => {
            state.filters.activeFilters = {}
            state.filters.pausedFilters = {}
            state.filters.filterPills = {}
          }),
          false,
          "filters.clearActiveFilters"
        )
        get().alerts.actions.filterItems()
      },

      addActiveFilter: (filterLabel, filterValue) => {
        set(
          produce((state) => {
            // use Set to prevent duplicate values
            state.filters.activeFilters[filterLabel] = [
              ...new Set([
                ...(state.filters.activeFilters[filterLabel] || []),
                filterValue,
              ]),
            ]
          }),
          false,
          "filters.addActiveFilter"
        )
        // after adding a new filter key and value: filter items
        get().alerts.actions.filterItems()
      },

      // add multiple values for a filter label
      addActiveFilters: (filterLabel, filterValues) => {
        set(
          produce((state) => {
            // use Set to prevent duplicate values
            state.filters.activeFilters[filterLabel] = [
              ...new Set([
                ...(state.filters.activeFilters[filterLabel] || []),
                ...filterValues,
              ]),
            ]
          }),
          false,
          "filters.addActiveFilters"
        )
        // after adding a new filter key and value: filter items
        get().alerts.actions.filterItems()
      },

      removeActiveFilter: (filterLabel, filterValue) => {
        set(
          produce((state) => {
            state.filters.activeFilters[filterLabel] =
              state.filters.activeFilters[filterLabel].filter(
                (value) => value !== filterValue
              )
            // if this was the last selected value delete the whole label key
            if (state.filters.activeFilters[filterLabel].length === 0) {
              delete state.filters.activeFilters[filterLabel]
            }
          }),
          false,
          "filters.removeActiveFilter"
        )
        // after removing a filter: filter items
        get().alerts.actions.filterItems()
      },

      addPausedFilter: (filterLabel, filterValue) => {
        set(
          produce((state) => {
            // use Set to prevent duplicate values
            state.filters.pausedFilters[filterLabel] = [
              ...new Set([
                ...(state.filters.pausedFilters[filterLabel] || []),
                filterValue,
              ]),
            ]
          }),
          false,
          "filters.addPausedFilter"
        )
        // after adding a new filter key and value: filter items
        get().alerts.actions.filterItems()
      },

      removePausedFilter: (filterLabel, filterValue) => {
        set(
          produce((state) => {
            state.filters.pausedFilters[filterLabel] =
              state.filters.pausedFilters[filterLabel].filter(
                (value) => value !== filterValue
              )
            // if this was the last selected value delete the whole label key
            if (state.filters.pausedFilters[filterLabel].length === 0) {
              delete state.filters.pausedFilters[filterLabel]
            }
          }),
          false,
          "filters.removePausedFilter"
        )
        // after removing a filter: filter items
        get().alerts.actions.filterItems()
      },

      setPredefinedFilters: (predefinedFilters) => {
        set(
          produce((state) => {
            state.filters.predefinedFilters = predefinedFilters
          }),
          false,
          "filters.setPredefinedFilters"
        )
      },

      setActivePredefinedFilter: (filterName) => {
        set(
          produce((state) => {
            state.filters.activePredefinedFilter = filterName
          }),
          false,
          "filters.setActivePredefinedFilter"
        )
        // after activating predefined filter: filter items
        get().alerts.actions.filterItems()
      },

      clearActivePredefinedFilter: () => {
        set(
          produce((state) => {
            state.filters.activePredefinedFilter = null
          }),
          false,
          "filters.clearActivePredefinedFilter"
        )
        // after clearing predefined filter: filter items
        get().alerts.actions.filterItems()
      },

      togglePredefinedFilter: (filterName) => {
        set(
          produce((state) => {
            // if active predefined filter is already set and equal to the one that was clicked, clear it
            if (state.filters.activePredefinedFilter === filterName) {
              state.filters.activePredefinedFilter = null
            } else {
              state.filters.activePredefinedFilter = filterName
            } // otherwise set the clicked filter as active
          }),
          false,
          "filters.togglePredefinedFilter"
        )
        // after activating predefined filter: filter items
        get().alerts.actions.filterItems()
      },

      // state to show Pills with active filters in the UI
      setFilterPills: (filter) => {
        set(
          produce((state) => {
            state.filters.filterPills = filter
          }),
          false,
          "filters.setFilterPills"
        )
      },

      // retieve all possible values for the given filter label from the list of items and add them to the list
      loadFilterLabelValues: (filterLabel) => {
        set(
          produce((state) => {
            state.filters.filterLabelValues[filterLabel] = { isLoading: true }
          }),
          false,
          "filters.loadFilterLabelValues.isLoading"
        )
        set(
          produce((state) => {
            // use Set to ensure unique values
            const values = [
              ...new Set(
                state.alerts.items.map((item) => item.labels[filterLabel])
              ),
            ]
            // remove any "blank" values from the list, then sort
            state.filters.filterLabelValues[filterLabel].values = values
              .filter((value) => (value ? true : false))
              .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

            state.filters.filterLabelValues[filterLabel].isLoading = false
          }),
          false,
          "filters.loadFilterLabelValues"
        )
      },

      // for each filter label where we already loaded the values, reload them
      reloadFilterLabelValues: () => {
        Object.keys(get().filters.filterLabelValues).map((label) => {
          get().filters.actions.loadFilterLabelValues(label)
        })
      },

      setSearchTerm: (searchTerm) => {
        set(
          produce((state) => {
            state.filters.searchTerm = searchTerm
          }),
          false,
          "filters.setSearchTerm"
        )
        // after setting the search term: filter items
        get().alerts.actions.filterItems()
      },

      // TODO:
      // update previously loaded filter label values (e.g. after new items were fetched, the possible values might have changed)
      // updateFilterLabelValues: () => {
      //   set(
      //     produce((state) => {
      //       Object.keys(state.filters.filterLabelValues).map((label) =>

      //       )
      //     })
      //   )
      // }
    },
  },
})

export default createFiltersSlice
