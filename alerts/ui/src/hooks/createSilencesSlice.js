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
    localItems: {},

    actions: {
      setSilences: ({ items, itemsHash, itemsByState }) => {
        if (!items) return

        set(
          produce((state) => {
            state.silences.items = items
            state.silences.itemsHash = itemsHash
            state.silences.itemsByState = itemsByState
            state.silences.isLoading = false
            state.silences.isUpdating = false
            state.silences.updatedAt = Date.now()
          }),
          false,
          "silences.setSilencesData"
        )
        // check if any local item can be removed
        get().silences.actions.updateLocalItems()
      },
      addLocalItem: (silence) => {
        if (!silence || !silence?.id) return

        const newLocalItems = { ...state.silences.localItems }
        newLocalItems[silence?.id] = silence

        return set(
          produce((state) => {
            state.silences.localItems = newLocalItems
          }),
          false,
          "silences.addLocalItem"
        )
      },
      updateLocalItems: () => {
        const newLocalSilences = { ...get().silences.localItems }
        Object.keys(newLocalSilences).forEach((silence) => {
          // check for the alert reference
          if (silence?.alertFingerPrint) {
            const alert = get().alerts.actions.getAlertByFingerprint(
              silence?.alertFingerPrint
            )
            // check if the silence is already added to the alert
            const silencedBy = alert?.status?.silencedBy
            if (silencedBy?.length > 0 && silencedBy?.includes("Mango")) {
              // mark to remove silence
              silence["remove"] = true
            }
          }
        })
        // remove silences marked to remove
        const reducedLocalSilences = Object.keys(newLocalSilences)
          .filter((key) => !newLocalSilences[key]?.remove)
          .reduce((obj, key) => {
            obj[key] = newLocalSilences[key]
            return obj
          }, {})

        return set(
          produce((state) => {
            state.silences.localItems = reducedLocalSilences
          }),
          false,
          "silences.updateLocalItems"
        )
      },
      setExcludedLabels: (labels) => {
        if (!labels) return

        // labels to hash object to easier access
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
