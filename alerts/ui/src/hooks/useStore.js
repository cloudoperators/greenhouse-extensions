import { create } from "zustand"
import { devtools } from "zustand/middleware"

const createUserActivitySlice = (set, get) => ({
  userActivity: {
    isActive: true,
    setIsActive: (activity) => {
      set((state) => ({
        userActivity: { ...state.userActivity, isActive: activity },
      }))
    },
  },
})

const createAlertsSlice = (set, get) => ({
  alerts: {
    items: [],
    totalCounts: {},
    severityCountsPerRegion: {},
    isLoading: false,
    updatedAt: null,

    setAlertsData: ({ items, counts }) =>
      set((state) => ({
        alerts: {
          ...state.alerts,
          items,
          totalCounts: counts?.global,
          severityCountsPerRegion: counts?.regions,
          isLoading: false,
          isUpdating: false,
          updatedAt: Date.now(),
        },
      })),

    setIsLoading: (value) =>
      set((state) => ({ alerts: { ...state.alerts, isLoading: value } })),
    setIsUpdating: (value) =>
      set((state) => ({ alerts: { ...state.alerts, isUpdating: value } })),
  },
})

const createFiltersSlice = (set, get) => ({
  filters: {
    keys: [],
    activeFilters: [],

    setKeys: (keys) =>
      set((state) => {
        return {
          filters: {
            ...state.filters,
            keys,
          },
        }
      }),
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

export default useStore
