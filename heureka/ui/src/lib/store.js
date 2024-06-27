import { createStore } from "zustand"
import { devtools } from "zustand/middleware"
import { produce } from "immer"
import { getServices, getFilterValues } from "../queries"

const initialFiltersState = {
  labels: [],
  activeFilters: {},
  filterLabelValues: {},
  predefinedFilters: [],
  activePredefinedFilter: null,
  searchTerm: "",
}

export default (options) =>
  createStore(
    devtools((set, get) => ({
      isUrlStateSetup: false,
      queryClientFnReady: false,
      endpoint: options?.apiEndpoint,
      bearerToken: options?.bearerToken,
      services: [],
      activeTab: "services",
      tabs: {
        services: {
          queryOptions: {
            first: 20,
          },
        },
        issues: {
          queryOptions: {
            first: 20,
          },
        },
      },
      filters: {
        ...initialFiltersState,
      },
      filteredServices: [],
      actions: {
        setQueryClientFnReady: (readiness) =>
          set(
            (state) => {
              state.queryClientFnReady = readiness
            },
            false,
            "setQueryClientFnReady"
          ),

        setActiveTab: (index) =>
          set(
            (state) => {
              state.activeTab = index
            },
            false,
            "setActiveTab"
          ),

        setQueryOptions: (tab, options) =>
          set(
            produce((state) => {
              state.tabs[tab].queryOptions = options
            }),
            false,
            "setQueryOptions"
          ),

        setServices: (services) =>
          set(
            produce((state) => {
              state.services = services
              state.filteredServices = services.filter((service) =>
                service.name
                  .toLowerCase()
                  .includes(state.filters.searchTerm.toLowerCase())
              )
            }),
            false,
            "setServices"
          ),

        setSearchTerm: (searchTerm) =>
          set(
            produce((state) => {
              state.filters.searchTerm = searchTerm
              state.filteredServices = state.services.filter((service) =>
                service.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
            }),
            false,
            "setSearchTerm"
          ),

        setActiveFilters: (activeFilters) =>
          set(
            produce((state) => {
              state.filters.activeFilters = activeFilters
              state.filteredServices = state.services.filter((service) => {
                return Object.keys(activeFilters).every((filterLabel) => {
                  return activeFilters[filterLabel].includes(
                    service[filterLabel]
                  )
                })
              })
            }),
            false,
            "setActiveFilters"
          ),

        clearActiveFilters: () =>
          set(
            produce((state) => {
              state.filters.activeFilters = {}
              state.filteredServices = state.services.filter((service) =>
                service.name
                  .toLowerCase()
                  .includes(state.filters.searchTerm.toLowerCase())
              )
            }),
            false,
            "clearActiveFilters"
          ),

        addActiveFilter: (filterLabel, filterValue) =>
          set(
            produce((state) => {
              if (!state.filters.activeFilters[filterLabel]) {
                state.filters.activeFilters[filterLabel] = []
              }
              state.filters.activeFilters[filterLabel].push(filterValue)
              state.filteredServices = state.services.filter((service) => {
                return Object.keys(state.filters.activeFilters).every(
                  (label) => {
                    return state.filters.activeFilters[label].includes(
                      service[label]
                    )
                  }
                )
              })
            }),
            false,
            "addActiveFilter"
          ),

        removeActiveFilter: (filterLabel, filterValue) =>
          set(
            produce((state) => {
              state.filters.activeFilters[filterLabel] =
                state.filters.activeFilters[filterLabel].filter(
                  (value) => value !== filterValue
                )
              if (state.filters.activeFilters[filterLabel].length === 0) {
                delete state.filters.activeFilters[filterLabel]
              }
              state.filteredServices = state.services.filter((service) => {
                return Object.keys(state.filters.activeFilters).every(
                  (label) => {
                    return state.filters.activeFilters[label].includes(
                      service[label]
                    )
                  }
                )
              })
            }),
            false,
            "removeActiveFilter"
          ),

        fetchFilterValues: async (filterLabel) => {
          const bearerToken = get().bearerToken
          const endpoint = get().endpoint
          const { data, error } = await getFilterValues(
            filterLabel,
            bearerToken,
            endpoint
          )

          if (error) {
            set((state) => {
              state.filters.filterLabelValues[filterLabel] = {
                isLoading: false,
                values: [],
                error: error.message,
              }
            })
          } else {
            const values = data.values || []
            set((state) => {
              state.filters.filterLabelValues[filterLabel] = {
                isLoading: false,
                values,
              }
            })
          }
        },

        fetchServices: async () => {
          const bearerToken = get().bearerToken
          const endpoint = get().endpoint
          const queryOptions = get().tabs.services.queryOptions
          const filters = get().filters.activeFilters
          const { data, error } = await getServices(bearerToken, endpoint, {
            ...queryOptions,
            filter: filters,
          })

          if (error) {
            console.error(error)
          } else {
            set().actions.setServices(
              data.Services.edges.map((edge) => edge.node)
            )
          }
        },
      },
    }))
  )
