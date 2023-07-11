import produce from "immer"

const createUserActivitySlice = (set, get) => ({
  userActivity: {
    isActive: true,

    actions: {
      setIsActive: (activity) => {
        set(
          (state) => ({
            userActivity: { ...state.userActivity, isActive: activity },
          }),
          false,
          "userActivity.setIsActive"
        )
      },
    },
  },
})

export default createUserActivitySlice
