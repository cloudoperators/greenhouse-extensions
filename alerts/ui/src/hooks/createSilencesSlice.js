import produce from "immer"

const createSilencesSlice = (set, get) => ({
  silences: {
    items: [],
    itemsHash: {},
    itemsByState: {},
    excludedLabels: [],
    excludedLabelsHash: {},
    isLoading: false,
    isUpdating: false,
    updatedAt: null,
    error: null,
    localItems: [],

    actions: {
      setSilences: ({ items, itemsHash, itemsByState }) => {
        if (!items) return

        return set(
          produce((state) => {
            state.silences.items = items
            state.silences.itemsHash = itemsHash
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
      setExcludedLabels: (labels) => {
        if (!labels) return

        console.log("setExcludedLabels: ", labels)

        const labelsHash = labels.reduce((map, label) => {
          map[label] = label
          return map
        }, {})

        return set(
          (state) => ({
            silences: {
              ...state.silences,
              excludedLabels: labels,
              excludedLabelsHash: labelsHash,
            },
          }),
          false,
          "silences.setExcludedLabels"
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
