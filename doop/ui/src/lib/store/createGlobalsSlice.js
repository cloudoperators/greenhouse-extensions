const createGlobalsSlice = (set, get) => ({
  globals: {
    endpoint: "",
    isMock: false,

    actions: {
      setEndpoint: (endpoint) =>
        set(
          (state) => ({ globals: { ...state.globals, endpoint: endpoint } }),
          false,
          "globals/setEndpoint"
        ),
      setMock: (isMock) =>
        set(
          (state) => ({ globals: { ...state.globals, isMock } }),
          false,
          "globals/setMock"
        ),
    },
  },
})

export default createGlobalsSlice
