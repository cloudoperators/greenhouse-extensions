import produce from "immer"

const createSilencesSlice = (set, get) => ({
  silences: {
    items: [],
    itemsHash: {},
    itemsByState: {},
    isLoading: false,
    isUpdating: false,
    updatedAt: null,
    error: null,
    localItems: [],

    actions: {
      setSilences: ({ items, itemsByState }) => {
        if (!items) return

        // remove duplicates
        const newItems = items.filter(
          (item, index) => items.findIndex((i) => i.id === item.id) === index
        )

        // convert to hash for faster access
        const hash = newItems.reduce((hash, silence) => {
          hash[silence.id] = silence
          return hash
        })

        return set(
          produce((state) => {
            state.silences.items = newItems
            state.silences.itemsHash = hash
            state.silences.itemsByState = itemsByState
            state.silences.isLoading = false
            state.silences.isUpdating = false
            state.silences.updatedAt = Date.now()
            state.silences.localItems = []
          }),
          false,
          "silences.setSilencesData"
        )
      },
      addSilence: (silence) => {
        let items = state.silences.localItems()
        items.push(silence)

        return set(
          produce((state) => {
            state.silences.localItems = items
          }),
          false,
          "silences.addSilence"
        )
      },
      setIsLoading: (value) =>
        set(
          (state) => ({ silences: { ...state.silences, isLoading: value } }),
          false,
          "silences.setIsLoading"
        ),
      setIsUpdating: (value) =>
        set(
          (state) => ({
            silences: { ...state.silences, isUpdating: value },
          }),
          false,
          "silences.setIsUpdating"
        ),
    },
  },
})

export default createSilencesSlice
