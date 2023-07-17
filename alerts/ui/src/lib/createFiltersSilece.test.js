import * as React from "react"
import { renderHook, act } from "@testing-library/react"
import {  
  useFilterLabels,
  useFilterActions,
  StoreProvider
} from "../hooks/useAppStore"
import {
  createFakeAlertStatustWith,
  createFakeAlertWith,
  createFakeSilenceWith,
} from "./fakeObjects"


describe("createFiltersSlice", () => {

  describe("setLabels", () => {
    it("return empty array as default", () => {
      const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
      const store = renderHook(
        () => ({
          actions: useFilterActions(),
          filterLabels: useFilterLabels(),
        }),
        { wrapper }
      )
      expect(store.result.current.filterLabels).toEqual([])
    })
  
    it("accepts and transforms to array of strings coma separated strings containing the labels to use", () => {
      const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
      const store = renderHook(
        () => ({
          actions: useFilterActions(),
          filterLabels: useFilterLabels(),
        }),
        { wrapper }
      )
  
      act(() => {
        store.result.current.actions.setLabels("app,cluster,cluster_type,context,job,region,service,severity,status,support_group,tier,type")
      })
  
      expect(store.result.current.filterLabels).toEqual(["app","cluster","cluster_type","context","job","region","service","severity","status","support_group","tier","type"])
    })

  })

})