import { create } from "zustand"

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
    isLoading: false,
    updatedAt: null,

    setItems: (items) =>
      set((state) => {
        return {
          alerts: {
            ...state.alerts,
            items,
            isLoading: false,
            isUpdating: false,
            updatedAt: Date.now(),
          },
        }
      }),
    setIsLoading: (value) =>
      set((state) => {
        return {
          alerts: { ...state.alerts, isLoading: value },
        }
      }),

    setIsUpdating: (value) =>
      set((state) => ({ alerts: { ...state.alerts, isUpdating: value } })),
  },
})

const useStore = create((set, get) => ({
  ...createAlertsSlice(set, get),
  ...createUserActivitySlice(set, get),
  urlStateKey: "supernova",
}))

export default useStore
