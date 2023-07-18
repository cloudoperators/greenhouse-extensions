import * as React from "react"
import { renderHook, act } from "@testing-library/react"
import {  
  useAlertsActions,
  useAlertEnrichedLabels,
  StoreProvider
} from "../hooks/useAppStore"


describe("createAlertsSlice", () => {

  describe("setEnrichedLabels", () => {
    it("return empty array as default", () => {
      const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
      const store = renderHook(
        () => ({
          actions: useAlertsActions(),
          enrichedLabels: useAlertEnrichedLabels(),
        }),
        { wrapper }
      )
      expect(store.result.current.enrichedLabels).toEqual([])
    })
  
    it("accepts and transforms to array of strings coma separated strings containing the labels to use", () => {
      const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
      const store = renderHook(
        () => ({
          actions: useAlertsActions(),
          enrichedLabels: useAlertEnrichedLabels(),
        }),
        { wrapper }
      )
  
      act(() => {
        store.result.current.actions.setEnrichedLabels("status")
      })
  
      expect(store.result.current.enrichedLabels).toEqual(["status"])
    })

  })

})