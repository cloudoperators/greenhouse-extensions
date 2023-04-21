import { create } from "zustand"
import { devtools } from "zustand/middleware"
import produce from "immer"
import { countAlerts } from "../lib/utils"

const createUserActivitySlice = (set, get) => ({
  userActivity: {
    isActive: true,

    actions: {
      setIsActive: (activity) => {
        set((state) => ({
          userActivity: { ...state.userActivity, isActive: activity },
        }), false, "userActivity.setIsActive")
      },
    },
  },
})

const createAlertsSlice = (set, get) => ({
  alerts: {
    items: [],
    itemsFiltered: [],
    totalCounts: {}, // { total: number, critical: number, ...},
    severityCountsPerRegion: {}, // {"eu-de-1": { total: number, critical: {total: number, suppressed: number}, warning: {...}, ...}
    regions: [], // save all available regions from initial list here
    isLoading: false,
    isUpdating: false,
    updatedAt: null,
    error: null,

    actions: {
      setAlertsData: ({ items, counts }) => {
        set(
          produce((state) => {
            state.alerts.items = items
            state.alerts.totalCounts = counts?.global
            state.alerts.severityCountsPerRegion = counts?.regions
            state.alerts.regions = Object.keys(counts?.regions).sort()
            state.alerts.isLoading = false
            state.alerts.isUpdating = false
            state.alerts.updatedAt = Date.now()
            
            // on the initial fetch copy all items to the filtered items list once since
            // most views operate on the filtered items list
            if (state.alerts.itemsFiltered.length === 0) {
              state.alerts.itemsFiltered = items
            }
            // TODO: 
            // reload previously loaded filter label values (they might have changed since last load)
            // state.filters.filterLabelValues = {} // -> do NOT just reset them, reload instead 
          }), false, "alerts.setAlertsData"
        )
        // if there are already active filters, filter the new list
        if (Object.keys(get().filters.activeFilters)?.length > 0 ) {
          get().alerts.actions.filterItems()
        }
      },

      filterItems: () => {
        set(
          produce((state) => {
            state.alerts.itemsFiltered = state.alerts.items.filter((item) => {
              let visible = true

              // active filters is an object where the keys correspond to labels and the value is an array of all selected values to be filtered by
              // iterate over all active filter keys and then check if one of the selected values matches the item's value for this key
              Object.keys(state.filters.activeFilters).forEach((key) => {
                // if the item's label value for the current label isn't included in the selected filters set visible to false, i.e. filter out item
                // this automatically leads to different values for the same label to be OR concatenated, while different labels are AND concatenated
                // so an item must have at least one of the selected values for each filtered label
                if (
                  state.filters.activeFilters[key].indexOf(item.labels[key]) < 0
                ) {
                  visible = false
                }
              })

              return visible
            })
          }), false, "alerts.filterItems"
        )
        get().alerts.actions.updateFilteredCounts()
      },

      setFilteredItems: (items) => {
        set(
          produce((state) => {
            state.alerts.itemsFiltered = items
          }), false, "alerts.setFilteredItems"
        )
        get().alerts.actions.updateFilteredCounts()
      },

      updateFilteredCounts: () => {
        const counts = countAlerts(get().alerts.itemsFiltered)
        set(
          produce((state) => {
            state.alerts.totalCounts = counts.global
            state.alerts.severityCountsPerRegion = counts.regions
          }), false, "alerts.updateFilteredCounts"
        )
      },

      setIsLoading: (value) =>
        set((state) => ({ alerts: { ...state.alerts, isLoading: value } }), false, "alerts.setIsLoading"),
      setIsUpdating: (value) =>
        set((state) => ({ alerts: { ...state.alerts, isUpdating: value } }), false, "alerts.setIsUpdating"),
    },
  },
})

const createFiltersSlice = (set, get) => ({
  filters: {
    labels: [], // labels to be used for filtering: [ "label1", "label2", "label3"]
    activeFilters: {}, // for each active filter key list the selected values: {key1: [value1], key2: [value2_1, value2_2], ...}
    filterLabelValues: {}, // contains all possible values for filter labels: {label1: ["val1", "val2", "val3", ...], label2: [...]}, lazy loaded when a label is selected for filtering

    actions: {
      setLabels: (labels) =>
        set((state) => {
          return {
            filters: {
              ...state.filters,
              labels,
            },
          }
        }, false, "filters.setLabels"),

      setActiveFilters: (activeFilters) => {
        set((state) => {
          return {
            filters: {
              ...state.filters,
              activeFilters,
            },
          }
        }, false, "filters.setActiveFilters")
        get().alerts.actions.filterItems()
      },

      clearActiveFilters: () => { 
        set(
          produce((state) => {
            state.filters.activeFilters = {}
          }), false, "filters.clearActiveFilters"
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
          }), false, "filters.addActiveFilter"
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
          }), false, "filters.removeActiveFilter"
        )
        // after removing a filter: filter items
        get().alerts.actions.filterItems()
      },

      // retieve all possible values for the given filter label from the list of items and add them to the list
      loadFilterLabelValues: (filterLabel) => {
        set(
          produce((state) => {
            state.filters.filterLabelValues[filterLabel] = {isLoading: true}
          }), false, "filters.loadFilterLabelValues.isLoading"
        )
        set(
          produce((state) => {
            // use Set to ensure unique values
            const values = [...new Set(state.alerts.items.map(item => item.labels[filterLabel]))]
            // remove any "blank" values from the list
            state.filters.filterLabelValues[filterLabel].values = values.filter((value) => value ? true : false)
            state.filters.filterLabelValues[filterLabel].isLoading = false
          }), false, "filters.loadFilterLabelValues"
        )
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

const useStore = create(
  devtools((set, get) => ({
    ...createAlertsSlice(set, get),
    ...createUserActivitySlice(set, get),
    ...createFiltersSlice(set, get),
    urlStateKey: "supernova",
  }))
)

// atomic exports only instead of exporting whole store
// See reasoning here: https://tkdodo.eu/blog/working-with-zustand

// Store exports
export const useUrlStateKey                   = () => useStore((state) => state.urlStateKey)

// UserActivity exports
export const useUserIsActive                  = () => useStore((state) => state.userActivity.isActive)

export const useUserActivityActions           = () => useStore((state) => state.userActivity.actions)

// Alert exports
export const useAlertsItems                   = () => useStore((state) => state.alerts.items)
export const useAlertsItemsFiltered           = () => useStore((state) => state.alerts.itemsFiltered)
export const useAlertsTotalCounts             = () => useStore((state) => state.alerts.totalCounts)
export const useAlertsSeverityCountsPerRegion = () => useStore((state) => state.alerts.severityCountsPerRegion)
export const useAlertsRegions                 = () => useStore((state) => state.alerts.regions)
export const useAlertsIsLoading               = () => useStore((state) => state.alerts.isLoading)
export const useAlertsIsUpdating              = () => useStore((state) => state.alerts.isUpdating)
export const useAlertsUpdatedAt               = () => useStore((state) => state.alerts.updatedAt)
export const useAlertsError                   = () => useStore((state) => state.alerts.error)

export const useAlertsActions                 = () => useStore((state) => state.alerts.actions)

// Filter exports
export const useFilterLabels                  = () => useStore((state) => state.filters.labels)
export const useActiveFilters                 = () => useStore((state) => state.filters.activeFilters)
export const useFilterLabelValues             = () => useStore((state) => state.filters.filterLabelValues)

export const useFilterActions                 = () => useStore((state) => state.filters.actions)
