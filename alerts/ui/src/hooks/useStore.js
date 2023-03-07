import { create } from "zustand"

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
// global zustand store. See how this works here: https://github.com/pmndrs/zustand
const useStore = create((set, get) => ({
  ...createAlertsSlice(set, get),

  urlStateKey: "supernova",
}))

export default useStore
