/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { renderHook, act } from "@testing-library/react"
import {
  useSilencesActions,
  useSilencesLocalItems,
  useAlertsActions,
  useAlertsItems,
  useSilencesExcludedLabels,
  StoreProvider,
} from "../hooks/useAppStore"
import {
  createFakeAlertStatustWith,
  createFakeAlertWith,
  createFakeSilenceWith,
  createFakeSilenceWithoutAlertFingerprint,
} from "./fakeObjects"
import { countAlerts } from "../lib/utils"

describe("addLocalItem", () => {
  it("should append the object with key silence id and value the silence itself", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        localSilences: useSilencesLocalItems(),
      }),
      { wrapper }
    )

    const silence = createFakeSilenceWith()

    act(() => {
      store.result.current.actions.addLocalItem({
        silence: silence,
        id: "test",
        type: "local",
      })
    })

    expect(Object.keys(store.result.current.localSilences).length).toEqual(1)
    expect(store.result.current.localSilences["test"]["id"]).toEqual("test")
    expect(store.result.current.localSilences["test"].alertFingerprint).toEqual(
      "123"
    )
  })
  it("should avoid to add any silences without id", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        localSilences: useSilencesLocalItems(),
      }),
      { wrapper }
    )

    const silence = createFakeSilenceWith()
    act(() => store.result.current.actions.addLocalItem({ silence, id: "", type: "local"}))
    act(() => store.result.current.actions.addLocalItem({ silence, id: null, type: "local" }))
    
    expect(Object.keys(store.result.current.localSilences).length).toEqual(0)
  })
  it("should add items with and expiring type and deleted if they are set in expired after a refetch if they dont have a alertfingerprint", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        localSilences: useSilencesLocalItems(),
      }),
      { wrapper }
    )

    const silence = createFakeSilenceWithoutAlertFingerprint({
      status: {state: "expiring"}
    })
    // add a local silence with type expiring
    act(() => {
      store.result.current.actions.addLocalItem({
        silence: silence,
        id: "test",
        type: "expiring",
      })
    }) 

    expect(Object.keys(store.result.current.localSilences).length).toEqual(1)
    expect(store.result.current.localSilences["test"]["id"]).toEqual("test")

    // set a silence with the same id in expired so it should be deleted (triggers updateLocalItems())
    act(() =>
      store.result.current.actions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { expired: [silence] },
      })
    )

    expect(Object.keys(store.result.current.localSilences).length).toEqual(0)

  })

  it("should add items with and expiring type and they should stay if they are set in active", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        localSilences: useSilencesLocalItems(),
      }),
      { wrapper }
    )

    const silence = createFakeSilenceWithoutAlertFingerprint({
      status: {state: "expiring"}
    })

    act(() => {
      store.result.current.actions.addLocalItem({
        silence: silence,
        id: "test",
        type: "expiring",
      })
    }) 

    expect(Object.keys(store.result.current.localSilences).length).toEqual(1)
    expect(store.result.current.localSilences["test"]["id"]).toEqual("test")
     // set a silence with the same id in active so it should not be deleted because 
     // local silence is expiring (triggers updateLocalItems())
   
    act(() =>
      store.result.current.actions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )

    expect(Object.keys(store.result.current.localSilences).length).toEqual(1)

  })


  it("should add silences with creating type and delete them if they are set in active silences after a refetch if they dont have a alertfingerprint", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        localSilences: useSilencesLocalItems(),
      }),
      { wrapper }
    )

    const silence = createFakeSilenceWithoutAlertFingerprint({
      status: {state: "creating"}
    })

    const silence2 = createFakeSilenceWith({
      id: "test2",
      status: {state: "creating"}
    })
    // add a local silences with type creating
    act(() => {
      store.result.current.actions.addLocalItem({
        silence: silence,
        id: "test",
        type: "creating",
      })

      store.result.current.actions.addLocalItem({
        silence: silence2,
        id: "test2",
        type: "creating",
      })
    }) 


    expect(Object.keys(store.result.current.localSilences).length).toEqual(2)
    expect(store.result.current.localSilences["test"]["id"]).toEqual("test")
    expect(store.result.current.localSilences["test2"]["id"]).toEqual("test2")

    // set a silence with the same id in active so it should be deleted (triggers updateLocalItems())  
    act(() =>
      store.result.current.actions.setSilences({
        items: [silence, silence2],
        itemsHash: { test: silence, test2: silence2 },
        itemsByState: { active: [silence, silence2] },
      })
    )

    expect(Object.keys(store.result.current.localSilences).length).toEqual(1)

    expect(store.result.current.localSilences["test2"]["id"]).toEqual("test2")


  })

  it("should add items with creating type and they should stay if they are set as an expired silence but not if its a pending one", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        localSilences: useSilencesLocalItems(),
      }),
      { wrapper }
    )

    const silence = createFakeSilenceWithoutAlertFingerprint({
      status: {state: "creating"}
    })

    act(() => {
      store.result.current.actions.addLocalItem({
        silence: silence,
        id: "test",
        type: "creating",
      })
    }) 

    expect(Object.keys(store.result.current.localSilences).length).toEqual(1)
    expect(store.result.current.localSilences["test"]["id"]).toEqual("test")
      // set a silence with the same id in pending so it should not be deleted because 
      // local silence is creating (triggers updateLocalItems())
   
    act(() =>
      store.result.current.actions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { expired: [silence] },
      })
    )

    expect(Object.keys(store.result.current.localSilences).length).toEqual(1)

    act(() =>
      store.result.current.actions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { pending: [silence] },
      })
    )

    expect(Object.keys(store.result.current.localSilences).length).toEqual(0)

  })
})

describe("getMappingSilences", () => {
  it("return all external silences referenced by silencedBy and all local silences with the same fingerprint which are not yet included", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
        localSilences: useSilencesLocalItems(),
      }),
      { wrapper }
    )

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    
    // create extern silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })

    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )
    // create local silence adding per attribute the id and the alert fingerprint
    const silence2 = createFakeSilenceWith()

    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence2,
        id: "local",
        type: "local",
      }))


    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(2)
    expect(mappingResult.map((item) => item.id)).toContainEqual("external")
    expect(mappingResult.map((item) => item.id)).toContainEqual("local")
    expect(mappingResult.find((item) => item.id === "local").type).toEqual(
      "local"
    )
  })

  it("return silences also when alert silencedBy is just a string", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // create an alert
    const status = createFakeAlertStatustWith({ silencedBy: "external" })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create local silence
    const silence = createFakeSilenceWith({ id: "external" })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )
    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(1)
    expect(mappingResult.map((item) => item.id)).toContainEqual("external")
  })

  it("ignores 'local silences' which are already included in silencedBy and exist as external silence", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external", "externalAndLocal"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create external silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })
    const silence2 = createFakeSilenceWith({ id: "externalAndLocal" })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence, silence2],
        itemsHash: { external: silence, externalAndLocal: silence2 },
        itemsByState: { active: [silence, silence2] },
      })
    )
    // create local silence which already exists as external silence
    const silence3 = createFakeSilenceWith()
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence3,
        id: "externalAndLocal",
      })
    )
    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(2)
    // checking type to be undefined means that the silence is not local
    expect(mappingResult[0].type).toEqual(undefined)
    expect(mappingResult[1].type).toEqual(undefined)
  })

  it("returns local silences when the id exists in silencedBy but it does not exist as external silence", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external", "local"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create external silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )
    // create local silence which already exists as external silence
    const silence2 = createFakeSilenceWith()
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence2,
        id: "local",
        type: "local"
      })
    )
    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(2)
    // checking type to be undefined means that the silence is not local
    expect(mappingResult[0].type).toEqual(undefined)
    expect(mappingResult[1].type).toEqual("local")
  })
})

describe("updateLocalItems", () => {
  it("removes local silences whose alert reference (defined by alertFingerprint) has in silencedBy the silence itself and a silence with same id exist also as external silences", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
        savedLocalSilences: useSilencesLocalItems(),
        savedAlerts: useAlertsItems(),
      }),
      { wrapper }
    )

    // create local silences
    const silence = createFakeSilenceWith( {alertFingerprint: "12345"})
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence,
        id: "test1local",
        type: "local",
      })
    )
    const silence2 = createFakeSilenceWith()
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence2,
        id: "test2local",
        type: "local",
      })
    )
    // check if the local silence are saved
    expect(Object.keys(store.result.current.savedLocalSilences).length).toEqual(
      2
    )
    // create an alert without any silencedBy so we just have the local silences
    const status = createFakeAlertStatustWith({
      silencedBy: ["test1local"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "12345" })
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // check if the alert is saved
    expect(store.result.current.savedAlerts.length).toEqual(1)
    

    // trigger update local items by setting new external silences
    const externalSilence = createFakeSilenceWith({ id: "test1local" })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [externalSilence],
        itemsHash: { [externalSilence.id]: externalSilence },
        itemsByState: { active: [externalSilence] },
      })
    )
    // check local items
    expect(Object.keys(store.result.current.savedLocalSilences).length).toEqual(
      1
    )
    expect(store.result.current.savedLocalSilences["test2local"].id).toEqual(
      "test2local"
    )
  })

  it("keeps local silences if silence with same id does not exist yet in external silences", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
        savedLocalSilences: useSilencesLocalItems(),
        savedAlerts: useAlertsItems(),
      }),
      { wrapper }
    )

    // create local silences
    const silence = createFakeSilenceWith()
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence,
        id: "test1local",
        type: "local",
      })
    )
    const silence2 = createFakeSilenceWith()
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence2,
        id: "test2local",
        type: "local",
      })
    )
    // check if the local silence are saved
    expect(Object.keys(store.result.current.savedLocalSilences).length).toEqual(
      2
    )
    // create an alert without any silencedBy so we just have the local silences
    const status = createFakeAlertStatustWith({
      silencedBy: ["test1local"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "12345" })
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // check if the alert is saved
    expect(store.result.current.savedAlerts.length).toEqual(1)
    // trigger update local items by setting new external silences
    const externalSilence = createFakeSilenceWith({
      id: "different_id_then_test1local",
    })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [externalSilence],
        itemsHash: { [externalSilence.id]: externalSilence },
        itemsByState: { active: [externalSilence] },
      })
    )
    // check local items
    expect(Object.keys(store.result.current.savedLocalSilences).length).toEqual(
      2
    )
    expect(store.result.current.savedLocalSilences["test1local"].id).toEqual(
      "test1local"
    )
    expect(store.result.current.savedLocalSilences["test2local"].id).toEqual(
      "test2local"
    )
  })
})

describe("getMappedState", () => {
  it("retuns supressed (processing) if a local silence is found", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create extern silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )
    // create local silence adding per attribute the id and the alert fingerprint
    const silence2 = createFakeSilenceWith()
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence2,
        id: "local",
        type: "local",
      })
    )
    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getMappedState(alert))
    )
    expect(mappingResult["type"]).toEqual("suppressed")
    expect(mappingResult["isProcessing"]).toEqual(true)
  })

  it("retuns just the alert.status.state if no local silences found", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create extern silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )
    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getMappedState(alert))
    )
    expect(mappingResult["type"]).toEqual(alert?.status?.state)
    expect(mappingResult["isProcessing"]).toEqual(false)
  })
})

describe("getExpiredSilences", () => {
  it("returns all silences which are expired matching the alert labels but omitting the excludeLabels", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // set the excluded labels
    act(() => store.result.current.silenceActions.setExcludedLabels(["pod"]))
    // create an alert with custom status
    const alert = createFakeAlertWith({
      fingerprint: "123",
      labels: {
        severity: "critical",
        support_group: "containers",
        service: "automation",
        pod: "test",
      },
    })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create external silences with different labels (service compute)
    const silence = createFakeSilenceWith({
      id: "test1",
      status: {
        state: "expired",
      },
      matchers: [
        { name: "severity", value: "critical", isRegex: false },
        { name: "support_group", value: "compute", isRegex: false },
        { name: "service", value: "compute", isRegex: false },
      ],
    })
    // create an external silences with matching labels
    const silence2 = createFakeSilenceWith({
      id: "test2",
      status: {
        state: "expired",
      },
      matchers: [
        { name: "severity", value: "critical", isRegex: false },
        { name: "support_group", value: "containers", isRegex: false },
        { name: "service", value: "automation", isRegex: false },
      ],
    })
    // create an external silences with less labels but matching
    const silence3 = createFakeSilenceWith({
      id: "test3",
      status: {
        state: "expired",
      },
      matchers: [
        { name: "severity", value: "info", isRegex: false },
        { name: "support_group", value: "containers", isRegex: false },
      ],
    })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence, silence2, silence3],
        itemsHash: { test1: silence, test2: silence2, test3: silence3 },
        itemsByState: { expired: [silence, silence2, silence3] },
      })
    )
    // get mapping silences
    let expResult = null
    act(
      () =>
        (expResult =
          store.result.current.silenceActions.getExpiredSilences(alert))
    )
    expect(expResult.length).toEqual(1)
    expect(expResult[0].id).toEqual("test2")
  })
})

describe("getLatestMappingSilence", () => {
  it("returns the silence with the latest endsAt timestamp when local", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create extern silences adding an id to the object
    const silence = createFakeSilenceWith({
      id: "external",
      endsAt: "2023-06-21T15:17:28.327Z",
    })
    const silence2 = createFakeSilenceWith({
      id: "external2",
      endsAt: "2023-06-21T16:18:28.327Z",
    })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence, silence2],
        itemsHash: { external: silence, external2: silence2 },
        itemsByState: { active: [silence, silence2] },
      })
    )
    // create local silence adding per attribute the id and the alert fingerprint
    const silence3 = createFakeSilenceWith({
      endsAt: "2023-06-21T19:17:28.327Z",
    })
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence3,
        id: "local",
        type: "local"
      })
    )
    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getLatestMappingSilence(alert))
    )
    expect(mappingResult.id).toEqual("local")
  })

  it("returns the silence with the latest endsAt timestamp when external", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        alertActions: useAlertsActions(),
        silenceActions: useSilencesActions(),
      }),
      { wrapper }
    )

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external", "external2"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      store.result.current.alertActions.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )
    // create extern silences adding an id to the object
    const silence = createFakeSilenceWith({
      id: "external",
      endsAt: "2023-06-21T15:17:28.327Z",
    })
    const silence2 = createFakeSilenceWith({
      id: "external2",
      endsAt: "2023-06-21T20:18:28.327Z",
    })
    act(() =>
      store.result.current.silenceActions.setSilences({
        items: [silence, silence2],
        itemsHash: { external: silence, external2: silence2 },
        itemsByState: { active: [silence, silence2] },
      })
    )
    // create local silence adding per attribute the id and the alert fingerprint
    const silence3 = createFakeSilenceWith({
      endsAt: "2023-06-21T19:17:28.327Z",
    })
    act(() =>
      store.result.current.silenceActions.addLocalItem({
        silence: silence3,
        id: "local",
        type: "local"
      })
    )
    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          store.result.current.silenceActions.getLatestMappingSilence(alert))
    )
    expect(mappingResult.id).toEqual("external2")
  })
})

describe("setExcludedLabels", () => {
  it("return empty array as default", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        excludedLabels: useSilencesExcludedLabels(),
      }),
      { wrapper }
    )
    expect(store.result.current.excludedLabels).toEqual([])
  })

  it("accepts array of strings containing the labels to use", () => {
    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        excludedLabels: useSilencesExcludedLabels(),
      }),
      { wrapper }
    )

    act(() => {
      store.result.current.actions.setExcludedLabels([
        "pod",
        "pod_name",
        "instance",
      ])
    })

    expect(store.result.current.excludedLabels).toEqual([
      "pod",
      "pod_name",
      "instance",
    ])
  })

  it("warn the user if labels are different then an array of strings", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {})

    const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>
    const store = renderHook(
      () => ({
        actions: useSilencesActions(),
        excludedLabels: useSilencesExcludedLabels(),
      }),
      { wrapper }
    )

    act(() =>
      store.result.current.actions.setExcludedLabels("pod,pod_name,instance")
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      "[supernova]::setExcludedLabels: labels object is not an array of strings"
    )
    spy.mockRestore()
  })
})
