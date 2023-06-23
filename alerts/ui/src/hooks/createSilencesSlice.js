import produce from "immer"

const initialSilencesState = {
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
}

const createSilencesSlice = (set, get) => ({
  silences: {
    ...initialSilencesState,
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
      addLocalItem: ({ silence, id, alertFingerprint }) => {
        // enforce silences with ids and alertFingerprint
        if (!silence || !id || !alertFingerprint) return
        return set(
          produce((state) => {
            state.silences.localItems = {
              ...get().silences.localItems,
              [id]: {
                ...silence,
                id,
                alertFingerprint,
                type: "local",
              },
            }
          }),
          false,
          "silences.addLocalItem"
        )
      },
      updateLocalItems: () => {
        const allSilences = get().silences.itemsHash
        let newLocalSilences = { ...get().silences.localItems }
        Object.keys(newLocalSilences).forEach((key) => {
          // check for the alert reference
          if (newLocalSilences[key]?.alertFingerprint) {
            const alert = get().alerts.actions.getAlertByFingerprint(
              newLocalSilences[key]?.alertFingerprint
            )

            // check if the alert has already the silence reference and if the extern silence already exists
            const silencedBy = alert?.status?.silencedBy
            if (
              silencedBy?.length > 0 &&
              silencedBy?.includes(newLocalSilences[key]?.id) &&
              allSilences[key]
            ) {
              // mark to remove silence
              newLocalSilences[key] = { ...newLocalSilences[key], remove: true }
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
      getMappingSilences: (alert) => {
        if (!alert) return
        const silences = get().silences.itemsHash
        const localSilences = get().silences.localItems
        const allSilences = { ...silences, ...localSilences }
        let silencedBy = alert?.status?.silencedBy || []

        // ensure silencedBy is an array
        if (!Array.isArray(silencedBy)) silencedBy = [silencedBy]
        const mappingSilences = silencedBy.map((id) => allSilences[id])
        return mappingSilences
      },
      getMappedState: (alert) => {
        if (!alert) return
        const silences = get().silences.actions.getMappingSilences(alert)
        const state = silences?.length > 0 ? "suppressed" : alert?.status?.state
        return state
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
    advanced: {
      resetSlice: () =>
        set(
          (state) => ({
            silences: { ...state.silences, ...initialSilencesState },
          }),
          false,
          "silences.resetSilencesState"
        ),
    },
  },
})

export default createSilencesSlice
