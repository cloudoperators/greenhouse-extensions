import * as React from "react"
import { renderHook, act } from "@testing-library/react"
import {
  useFilterLabels,
  useFilterActions,
  useSearchTerm,
  StoreProvider,
} from "../hooks/useAppStore"

const originalConsoleError = global.console.warn

describe("createFiltersSlice", () => {
  describe("setLabels", () => {
    it("return default status label", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useFilterActions(),
          filterLabels: useFilterLabels(),
        }),
        { wrapper }
      )
      expect(store.result.current.filterLabels).toEqual(["status"])
    })

    it("just accepts array of strings", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useFilterActions(),
          filterLabels: useFilterLabels(),
        }),
        { wrapper }
      )

      act(() => {
        store.result.current.actions.setLabels([
          "app",
          "cluster",
          "cluster_type",
          "context",
          "job",
          "region",
          "service",
          "severity",
          "support_group",
          "tier",
          "type",
        ])
      })

      expect(store.result.current.filterLabels).toEqual([
        "app",
        "cluster",
        "cluster_type",
        "context",
        "job",
        "region",
        "service",
        "severity",
        "status",
        "support_group",
        "tier",
        "type",
      ])
    })

    it("warn the user if labels are different then an array of strings", () => {
      const spy = jest.spyOn(console, "warn").mockImplementation(() => {})

      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useFilterActions(),
          filterLabels: useFilterLabels(),
        }),
        { wrapper }
      )

      act(() =>
        store.result.current.actions.setLabels(
          "app,cluster,cluster_type,context,job,region,service,severity,status,support_group,tier,type"
        )
      )

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(
        "[supernova]::setLabels: labels object is not an array of strings"
      )
      spy.mockRestore()
    })
  })
  describe("setSearchTerm", () => {
    it("empty search term", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useFilterActions(),
          searchTerm: useSearchTerm(),
        }),
        { wrapper }
      )

      expect(store.result.current.searchTerm).toEqual("")
    })

    it("Set a search term", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          actions: useFilterActions(),
          searchTerm: useSearchTerm(),
        }),
        { wrapper }
      )

      act(() => {
        store.result.current.actions.setSearchTerm("k8s")
      })

      expect(store.result.current.searchTerm).toEqual("k8s")
    })
  })
})
