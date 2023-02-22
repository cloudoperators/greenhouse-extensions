import React from "react"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

// global zustand store. See how this works here: https://github.com/pmndrs/zustand
const useStore = create(
  devtools((set) => ({
    endpoint: "",
    setEndpoint: (newEndpoint) => set((state) => ({ endpoint: newEndpoint })),
    
    urlStateKey: "",
    setUrlStateKey: (newUrlStateKey) =>
      set((state) => ({ urlStateKey: newUrlStateKey })),
  }))
)

export default useStore
