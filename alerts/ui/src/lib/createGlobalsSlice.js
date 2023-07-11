import produce from "immer"

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

export default createGlobalsSlice
