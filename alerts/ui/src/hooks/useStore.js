import { create } from "zustand"
import { devtools } from "zustand/middleware"
import produce from "immer"
import { countAlerts } from "../lib/utils"
import createSilencesSlice from "./createSilencesSlice"
import { u } from "juno-ui-components/build/DataList.component-9bf888b5"

const createGlobalsSlice = (set, get) => ({
  globals: {
    embedded: false,
    isUrlStateSetup: false,
    showDetailsFor: null,
    apiEndpoint: null,

    actions: {
      setEmbedded: (embedded) =>
        set(
          (state) => ({ globals: { ...state.globals, embedded: embedded } }),
          false,
          "globals/setEmbedded"
        ),
      setIsUrlStateSetup: (setup) =>
        set(
          (state) => ({
            globals: { ...state.globals, isUrlStateSetup: setup },
          }),
          false,
          "globals/setIsUrlStateSetup"
        ),
      setShowDetailsFor: (alertID) =>
        set(
          (state) => ({
            globals: { ...state.globals, showDetailsFor: alertID },
          }),
          false,
          "globals/setShowDetailsFor"
        ),
      setApiEndpoint: (endpoint) =>
        set(
          (state) => ({
            globals: { ...state.globals, apiEndpoint: endpoint },
          }),
          false,
          "globals/setShowDetailsFor"
        ),
    },
  },
})

export const ACTIONS = {
  SIGN_ON: "signOn",
  SIGN_OUT: "signOut",
}

const createAuthDataSlice = (set, get) => ({
  auth: {
    data: null,
    isProcessing: false,
    loggedIn: false,
    error: null,
    lastAction: {},
    appLoaded: false,
    appIsLoading: false,

    actions: {
      setAppLoaded: (appLoaded) => {
        set(
          (state) => ({ auth: { ...state.auth, appLoaded } }),
          false,
          "auth/setAppLoaded"
        )
      },
      setData: (data) => {
        if (!data) return
        set(
          (state) => ({
            auth: {
              ...state.auth,
              isProcessing: data?.isProcessing,
              loggedIn: data?.loggedIn,
              error: data?.error,
              data: data?.auth,
            },
          }),
          false,
          "auth/setData"
        )
      },
      setAction: (name) =>
        set(
          (state) => ({
            auth: {
              ...state.auth,
              lastAction: { name: name, updatedAt: Date.now() },
            },
          }),
          false,
          "auth/setAction"
        ),
      login: () => get().auth.actions.setAction(ACTIONS.SIGN_ON),
      logout: () => get().auth.actions.setAction(ACTIONS.SIGN_OUT),
    },
  },
})

const createUserActivitySlice = (set, get) => ({
  userActivity: {
    isActive: true,

    actions: {
      setIsActive: (activity) => {
        set(
          (state) => ({
            userActivity: { ...state.userActivity, isActive: activity },
          }),
          false,
          "userActivity.setIsActive"
        )
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
    regionsFiltered: [], // regions list filtered by active predefined filters
    enrichedLabels: [], // labels that are enriched by the alert worker
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

            // same with the filtered regions list
            if (state.alerts.regionsFiltered.length === 0) {
              state.alerts.regionsFiltered = state.alerts.regions
            }

            // TODO:
            // reload previously loaded filter label values (they might have changed since last load)
            // state.filters.filterLabelValues = {} // -> do NOT just reset them, reload instead
          }),
          false,
          "alerts.setAlertsData"
        )
        // if there are already active filters or active predefined filters, filter the new list
        if (
          Object.keys(get().filters.activeFilters)?.length > 0 ||
          get().filters.activePredefinedFilter
        ) {
          get().alerts.actions.filterItems()
        }
      },

      filterItems: () => {
        const activePredefinedFilter = get().filters.predefinedFilters.find(
          (filter) => filter.name === get().filters.activePredefinedFilter
        )

        const filteredRegions = new Set()

        set(
          produce((state) => {
            state.alerts.itemsFiltered = state.alerts.items.filter((item) => {
              let visible = true

              // test if item labels match the regex matchers of the active predefined filter
              // for each key and value pair in the filter matchers check if the key's value regex matches the item's label value for this key
              // if it doesn't match, set visible to false and break out of the loop
              activePredefinedFilter &&
                Object.entries(activePredefinedFilter.matchers).forEach(
                  ([key, value]) => {
                    if (!new RegExp(value, "i").test(item.labels[key])) {
                      visible = false
                      return
                    } else {
                      // if the item is visible, add the item's region to the filtered regions set
                      // this way the filtered Regions set will contain all regions that have at least one visible item
                      filteredRegions.add(item.labels.region)
                    }
                  }
                )

              // if the item is still visible after the predefined filters, check if it gets filtered out by the active filters
              // active filters is an object where the keys correspond to labels and the value is an array of all selected values to be filtered by
              // iterate over all active filter keys and then check if one of the selected values matches the item's value for this key
              if (visible) {
                Object.keys(state.filters.activeFilters).forEach((key) => {
                  // if the item's label value for the current label isn't included in the selected filters set visible to false, i.e. filter out item
                  // this automatically leads to different values for the same label to be OR concatenated, while different labels are AND concatenated
                  // so an item must have at least one of the selected values for each filtered label
                  if (
                    state.filters.activeFilters[key].indexOf(item.labels[key]) <
                    0
                  ) {
                    // we can break out of the loop here since we already know the item is not visible
                    visible = false
                    return
                  }
                })
              }

              return visible
            })
          }),
          false,
          "alerts.filterItems"
        )
        get().alerts.actions.updateFilteredCounts()
        if (filteredRegions.size > 0) {
          get().alerts.actions.setRegionsFiltered(
            Array.from(filteredRegions).sort()
          )
        } else {
          // if nothing was filtered out, set the filtered regions to all available regions
          get().alerts.actions.setRegionsFiltered(get().alerts.regions)
        }
      },

      setFilteredItems: (items) => {
        set(
          produce((state) => {
            state.alerts.itemsFiltered = items
          }),
          false,
          "alerts.setFilteredItems"
        )
        get().alerts.actions.updateFilteredCounts()
      },

      setRegionsFiltered: (regions) => {
        set(
          produce((state) => {
            state.alerts.regionsFiltered = regions
          }),
          false,
          "alerts.setRegionsFiltered"
        )
      },

      updateFilteredCounts: () => {
        const counts = countAlerts(get().alerts.itemsFiltered)
        set(
          produce((state) => {
            state.alerts.totalCounts = counts.global
            state.alerts.severityCountsPerRegion = counts.regions
          }),
          false,
          "alerts.updateFilteredCounts"
        )
      },

      setIsLoading: (value) => {
        set(
          (state) => ({ alerts: { ...state.alerts, isLoading: value } }),
          false,
          "alerts.setIsLoading"
        )
      },

      setIsUpdating: (value) => {
        set(
          (state) => ({ alerts: { ...state.alerts, isUpdating: value } }),
          false,
          "alerts.setIsUpdating"
        )
      },

      setEnrichedLabels: (labels) => {
        set(
          (state) => ({ alerts: { ...state.alerts, enrichedLabels: labels } }),
          false,
          "alerts.setEnrichedLabels"
        )
      },

      getAlertByFingerprint: (fingerprint) => {
        return get().alerts.items.find(
          (alert) => alert.fingerprint === fingerprint
        )
      },
    },
  },
})

const createFiltersSlice = (set, get) => ({
  filters: {
    labels: [], // labels to be used for filtering: [ "label1", "label2", "label3"]
    activeFilters: {}, // for each active filter key list the selected values: {key1: [value1], key2: [value2_1, value2_2], ...}
    filterLabelValues: {}, // contains all possible values for filter labels: {label1: ["val1", "val2", "val3", ...], label2: [...]}, lazy loaded when a label is selected for filtering
    predefinedFilters: [], // predefined complex filters that filter using regex: [{name: "filter1", displayName: "Filter 1", matchers: {"label1": "regex1", "label2": "regex2", ...}}, ...]
    activePredefinedFilter: null, // the currently active predefined filter

    actions: {
      setLabels: (labels) =>
        set(
          (state) => {
            return {
              filters: {
                ...state.filters,
                labels,
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

      clearActiveFilters: () => {
        set(
          produce((state) => {
            state.filters.activeFilters = {}
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
            // remove any "blank" values from the list
            state.filters.filterLabelValues[filterLabel].values = values.filter(
              (value) => (value ? true : false)
            )
            state.filters.filterLabelValues[filterLabel].isLoading = false
          }),
          false,
          "filters.loadFilterLabelValues"
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
    ...createGlobalsSlice(set, get),
    ...createAuthDataSlice(set, get),
    ...createUserActivitySlice(set, get),
    ...createAlertsSlice(set, get),
    ...createFiltersSlice(set, get),
    ...createSilencesSlice(set, get),
  }))
)

// atomic exports only instead of exporting whole store
// See reasoning here: https://tkdodo.eu/blog/working-with-zustand

// Globals exports
export const useGlobalsEmbedded = () =>
  useStore((state) => state.globals.embedded)
export const useGlobalsIsUrlStateSetup = () =>
  useStore((state) => state.globals.isUrlStateSetup)
export const useShowDetailsFor = () =>
  useStore((state) => state.globals.showDetailsFor)
export const useGlobalsApiEndpoint = () =>
  useStore((state) => state.globals.apiEndpoint)
export const useGlobalsActions = () =>
  useStore((state) => state.globals.actions)

// AUTH
export const useAuthData = () => useStore((state) => state.auth.data)
export const useAuthIsProcessing = () =>
  useStore((state) => state.auth.isProcessing)
export const useAuthLoggedIn = () => useStore((state) => state.auth.loggedIn)
export const useAuthError = () => useStore((state) => state.auth.error)
export const useAuthLastAction = () =>
  useStore((state) => state.auth.lastAction)
export const useAuthAppLoaded = () => useStore((state) => state.auth.appLoaded)
export const useAuthAppIsLoading = () =>
  useStore((state) => state.auth.appIsLoading)
export const useAuthActions = () => useStore((state) => state.auth.actions)

// UserActivity exports
export const useUserIsActive = () =>
  useStore((state) => state.userActivity.isActive)

export const useUserActivityActions = () =>
  useStore((state) => state.userActivity.actions)

// Alert exports
export const useAlertsItems = () => useStore((state) => state.alerts.items)
export const useAlertsItemsFiltered = () =>
  useStore((state) => state.alerts.itemsFiltered)
export const useAlertsTotalCounts = () =>
  useStore((state) => state.alerts.totalCounts)
export const useAlertsSeverityCountsPerRegion = () =>
  useStore((state) => state.alerts.severityCountsPerRegion)
export const useAlertsRegions = () => useStore((state) => state.alerts.regions)
export const useAlertsRegionsFiltered = () =>
  useStore((state) => state.alerts.regionsFiltered)
export const useAlertsIsLoading = () =>
  useStore((state) => state.alerts.isLoading)
export const useAlertsIsUpdating = () =>
  useStore((state) => state.alerts.isUpdating)
export const useAlertsUpdatedAt = () =>
  useStore((state) => state.alerts.updatedAt)
export const useAlertsError = () => useStore((state) => state.alerts.error)
export const useAlertEnrichedLabels = () =>
  useStore((state) => state.alerts.enrichedLabels)

export const useAlertsActions = () => useStore((state) => state.alerts.actions)

// Filter exports
export const useFilterLabels = () => useStore((state) => state.filters.labels)
export const useActiveFilters = () =>
  useStore((state) => state.filters.activeFilters)
export const useFilterLabelValues = () =>
  useStore((state) => state.filters.filterLabelValues)
export const usePredefinedFilters = () =>
  useStore((state) => state.filters.predefinedFilters)
export const useActivePredefinedFilter = () =>
  useStore((state) => state.filters.activePredefinedFilter)

export const useFilterActions = () => useStore((state) => state.filters.actions)

// Silences exports
export const useSilencesItems = () => useStore((state) => state.silences.items)
export const useSilencesItemsHash = () =>
  useStore((state) => state.silences.itemsHash)
export const useSilencesExcludedLabels = () =>
  useStore((state) => state.silences.excludedLabels)
export const useSilencesExcludedLabelsHash = () =>
  useStore((state) => state.silences.excludedLabelsHash)
export const useSilencesIsLoading = () =>
  useStore((state) => state.silences.isLoading)
export const useSilencesIsUpdating = () =>
  useStore((state) => state.silences.isUpdating)
export const useSilencesUpdatedAt = () =>
  useStore((state) => state.silences.updatedAt)
export const useSilencesError = () => useStore((state) => state.silences.error)
export const useSilencesLocalItems = () =>
  useStore((state) => state.silences.localItems)

export const useSilencesActions = () =>
  useStore((state) => state.silences.actions)
export const useSilencesAdvanced = () =>
  useStore((state) => state.silences.advanced)
