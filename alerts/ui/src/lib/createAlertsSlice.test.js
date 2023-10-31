import * as React from "react"
import { renderHook, act } from "@testing-library/react"
import {
  useAlertsActions,
  useAlertEnrichedLabels,
  StoreProvider,
} from "../hooks/useAppStore"

describe("createAlertsSlice", () => {
  describe("setEnrichedLabels", () => {
    it("return status as default", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useAlertsActions(),
          enrichedLabels: useAlertEnrichedLabels(),
        }),
        { wrapper }
      )
      expect(store.result.current.enrichedLabels).toEqual(["status"])
    })
  })
})
