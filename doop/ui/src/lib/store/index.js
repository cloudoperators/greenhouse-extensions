import { createStore } from "zustand"
import { devtools } from "zustand/middleware"
import createDataSlice from "./createDataSlice"
import createFiltersSlice from "./createFiltersSlice"
import createAuthDataSlice from "./createAuthDataSlice"
import createUserActivitySlice from "./createUserActivitySlice"

export default () =>
  createStore(
    devtools((set, get) => ({
      ...createUserActivitySlice(set, get),
      ...createAuthDataSlice(set, get),
      ...createFiltersSlice(set, get),
      ...createDataSlice(set, get),
    }))
  )
