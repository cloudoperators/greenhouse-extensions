/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { renderHook, act } from "@testing-library/react"
import StoreProvider, {
  useDataActions,
  useFiltersActions,
  useDataFilteredItems,
} from "../../components/StoreProvider"
import data from "../../../db.json"

describe("createFiltersSlice", () => {
  describe("set", () => {
    it("should update the filtered items", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          dataActions: useDataActions(),
          filterActions: useFiltersActions(),
          filteredItems: useDataFilteredItems(),
        }),
        { wrapper }
      )
      act(() => {
        store.result.current.dataActions.setData(data)
      })
      expect(Object.keys(store.result.current.filteredItems).length).toEqual(
        data.templates.length
      )

      // set filters
      act(() => {
        store.result.current.filterActions.set([
          { key: "check:support-group", value: "support-group-2" },
          { key: "check:support-group", value: "support-group-4" },
        ])
      })
      expect(
        store.result.current.filteredItems.length < data.templates.length
      ).toEqual(true)
    })
  })

  describe("add", () => {
    it("should update the filtered items", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          dataActions: useDataActions(),
          filterActions: useFiltersActions(),
          filteredItems: useDataFilteredItems(),
        }),
        { wrapper }
      )
      act(() => {
        store.result.current.dataActions.setData(data)
      })
      expect(store.result.current.filteredItems.length).toEqual(
        data.templates.length
      )
      // add filters
      act(() => {
        store.result.current.filterActions.add(
          "check:support-group",
          "support-group-2"
        )
      })
      expect(
        store.result.current.filteredItems.length < data.templates.length
      ).toEqual(true)
    })
  })

  describe("remove", () => {
    it("should update the filtered items", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          dataActions: useDataActions(),
          filterActions: useFiltersActions(),
          filteredItems: useDataFilteredItems(),
        }),
        { wrapper }
      )
      act(() => {
        store.result.current.dataActions.setData(data)
      })
      expect(store.result.current.filteredItems.length).toEqual(
        data.templates.length
      )
      // set filters
      act(() => {
        store.result.current.filterActions.set([
          { key: "check:support_group", value: "support-group-2" },
          { key: "check:support_group", value: "support-group-4" },
        ])
      })
      expect(store.result.current.filteredItems.length).toEqual(2)

      // remove a filter
      act(() => {
        store.result.current.filterActions.remove(
          "check:support_group",
          "support-group-2"
        )
      })
      expect(store.result.current.filteredItems.length).toEqual(1)
    })
  })

  describe("removeAll", () => {
    it("should update the filtered items", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          dataActions: useDataActions(),
          filterActions: useFiltersActions(),
          filteredItems: useDataFilteredItems(),
        }),
        { wrapper }
      )
      act(() => {
        store.result.current.dataActions.setData(data)
      })
      expect(store.result.current.filteredItems.length).toEqual(
        data.templates.length
      )
      // set filters
      act(() => {
        store.result.current.filterActions.set([
          { key: "check:support_group", value: "support-group-2" },
          { key: "check:support_group", value: "support-group-4" },
        ])
      })
      expect(
        store.result.current.filteredItems.length < data.templates.length
      ).toEqual(true)
      // remove a filter
      act(() => {
        store.result.current.filterActions.removeAll()
      })
      expect(store.result.current.filteredItems.length).toEqual(
        data.templates.length
      )
    })
  })

  describe("setSearchTerm", () => {
    it("should update the filtered items", () => {
      const wrapper = ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
      const store = renderHook(
        () => ({
          dataActions: useDataActions(),
          filterActions: useFiltersActions(),
          filteredItems: useDataFilteredItems(),
        }),
        { wrapper }
      )
      act(() => {
        store.result.current.dataActions.setData(data)
      })
      expect(store.result.current.filteredItems.length).toEqual(
        data.templates.length
      )
      // set search term. It should match the support_group name
      act(() => {
        store.result.current.filterActions.setSearchTerm("support-group-2")
      })
      expect(
        store.result.current.filteredItems.length < data.templates.length
      ).toEqual(true)
    })
  })
})
