import { renderHook, act, waitFor } from "@testing-library/react"
import {
  useSilencesActions,
  useSilencesLocalItems,
  useAlertsActions,
  useAlertsItems,
  useSilences,
  useSilencesAdvanced,
} from "./useStore"
import {
  createFakeAlertStatustWith,
  createFakeAlertWith,
  createFakeSilenceWith,
} from "./fakeObjects"
import { countAlerts } from "../lib/utils"

describe("addLocalItem", () => {
  beforeEach(() => {
    const advanced = renderHook(useSilencesAdvanced)
    act(() => advanced.result.current.resetSlice())
  })

  it("should append the object with key silence id and value the silence itself", () => {
    const actions = renderHook(useSilencesActions)

    const silence = createFakeSilenceWith()
    act(() =>
      actions.result.current.addLocalItem({
        silence,
        id: "test",
        alertFingerprint: "123",
      })
    )

    const { result } = renderHook(useSilencesLocalItems)
    expect(Object.keys(result.current).length).toEqual(1)
    expect(result.current["test"]["id"]).toEqual("test")
    expect(result.current["test"]["alertFingerprint"]).toEqual("123")
  })
  it("should avoid to add any silences without id or alertFingerprint", () => {
    const actions = renderHook(useSilencesActions)

    const silence = createFakeSilenceWith()
    act(() => actions.result.current.addLocalItem({ silence, id: "" }))
    act(() => actions.result.current.addLocalItem({ silence, id: null }))
    act(() =>
      actions.result.current.addLocalItem({
        silence,
        id: "test",
        alertFingerprint: "",
      })
    )
    act(() =>
      actions.result.current.addLocalItem({
        silence,
        id: "test",
        alertFingerprint: null,
      })
    )

    const { result } = renderHook(useSilencesLocalItems)
    expect(Object.keys(result.current).length).toEqual(0)
  })
})

describe("getMappingSilences", () => {
  beforeEach(() => {
    const advanced = renderHook(useSilencesAdvanced)
    act(() => advanced.result.current.resetSlice())
  })

  it("return all external silences referenced by silencedBy and all local silences with the same fingerprint which are not yet included", () => {
    const alertActions = renderHook(useAlertsActions)
    const silenceActions = renderHook(useSilencesActions)

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      alertActions.result.current.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )

    // create extern silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })
    act(() =>
      silenceActions.result.current.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )

    // create local silence adding per attribute the id and the alert fingerprint
    const silence2 = createFakeSilenceWith()
    act(() =>
      silenceActions.result.current.addLocalItem({
        silence: silence2,
        id: "local",
        alertFingerprint: "123",
      })
    )

    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          silenceActions.result.current.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(2)
    expect(mappingResult.map((item) => item.id)).toContainEqual("external")
    expect(mappingResult.map((item) => item.id)).toContainEqual("local")
    expect(mappingResult.find((item) => item.id === "local").type).toEqual(
      "local"
    )
  })

  it("return silences also when alert silencedBy is just a string", () => {
    const alertActions = renderHook(useAlertsActions)
    const silenceActions = renderHook(useSilencesActions)

    // create an alert
    const status = createFakeAlertStatustWith({ silencedBy: "external" })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      alertActions.result.current.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )

    // create local silence
    const silence = createFakeSilenceWith({ id: "external" })
    act(() =>
      silenceActions.result.current.setSilences({
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
          silenceActions.result.current.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(1)
    expect(mappingResult.map((item) => item.id)).toContainEqual("external")
  })
  it("ignores 'local silences' which are already included in silencedBy and exist as external silence", () => {
    const alertActions = renderHook(useAlertsActions)
    const silenceActions = renderHook(useSilencesActions)

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external", "externalAndLocal"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      alertActions.result.current.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )

    // create external silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })
    const silence2 = createFakeSilenceWith({ id: "externalAndLocal" })
    act(() =>
      silenceActions.result.current.setSilences({
        items: [silence, silence2],
        itemsHash: { external: silence, externalAndLocal: silence2 },
        itemsByState: { active: [silence, silence2] },
      })
    )

    // create local silence which already exists as external silence
    const silence3 = createFakeSilenceWith()
    act(() =>
      silenceActions.result.current.addLocalItem({
        silence: silence3,
        id: "externalAndLocal",
        alertFingerprint: "123",
      })
    )

    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          silenceActions.result.current.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(2)
    // checking type to be undefined means that the silence is not local
    expect(mappingResult[0].type).toEqual(undefined)
    expect(mappingResult[1].type).toEqual(undefined)
  })
  it("returns local silences when the id exists in silencedBy but it does not exist as external silence", () => {
    const alertActions = renderHook(useAlertsActions)
    const silenceActions = renderHook(useSilencesActions)

    // create an alert with custom status
    const status = createFakeAlertStatustWith({
      silencedBy: ["external", "local"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
    // set the alert
    act(() =>
      alertActions.result.current.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )

    // create external silences adding an id to the object
    const silence = createFakeSilenceWith({ id: "external" })
    act(() =>
      silenceActions.result.current.setSilences({
        items: [silence],
        itemsHash: { external: silence },
        itemsByState: { active: [silence] },
      })
    )

    // create local silence which already exists as external silence
    const silence2 = createFakeSilenceWith()
    act(() =>
      silenceActions.result.current.addLocalItem({
        silence: silence2,
        id: "local",
        alertFingerprint: "123",
      })
    )

    // get mapping silences
    let mappingResult = null
    act(
      () =>
        (mappingResult =
          silenceActions.result.current.getMappingSilences(alert))
    )
    expect(mappingResult.length).toEqual(2)
    // checking type to be undefined means that the silence is not local
    expect(mappingResult[0].type).toEqual(undefined)
    expect(mappingResult[1].type).toEqual("local")
  })
})

describe("updateLocalItems", () => {
  beforeEach(() => {
    const advanced = renderHook(useSilencesAdvanced)
    act(() => advanced.result.current.resetSlice())
  })

  it("removes local silences whose alert reference (defined by alertFingerprint) has in silencedBy the silence itself and a silence with same id exist also as external silences", () => {
    const alertActions = renderHook(useAlertsActions)
    const silenceActions = renderHook(useSilencesActions)

    // create local silences
    const silence = createFakeSilenceWith()
    act(() =>
      silenceActions.result.current.addLocalItem({
        silence: silence,
        id: "test1local",
        alertFingerprint: "12345",
      })
    )
    const silence2 = createFakeSilenceWith()
    act(() =>
      silenceActions.result.current.addLocalItem({
        silence: silence2,
        id: "test2local",
        alertFingerprint: "non_existing_alert",
      })
    )

    // check if the local silence are saved
    const { result: savedLocalSilences } = renderHook(useSilencesLocalItems)
    expect(Object.keys(savedLocalSilences.current).length).toEqual(2)

    // create an alert without any silencedBy so we just have the local silences
    const status = createFakeAlertStatustWith({
      silencedBy: ["test1local"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "12345" })
    act(() =>
      alertActions.result.current.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )

    // check if the alert is saved
    const { result: savedAlerts } = renderHook(useAlertsItems)
    expect(savedAlerts.current.length).toEqual(1)

    // trigger update local items by setting new external silences
    const externalSilence = createFakeSilenceWith({ id: "test1local" })
    act(() =>
      silenceActions.result.current.setSilences({
        items: [externalSilence],
        itemsHash: { [externalSilence.id]: externalSilence },
        itemsByState: { active: [externalSilence] },
      })
    )

    // check local items
    expect(Object.keys(savedLocalSilences.current).length).toEqual(1)
    expect(savedLocalSilences.current["test2local"].id).toEqual("test2local")
  })

  it("keeps local silences if silence with same id does not exist yet in external silences", () => {
    const alertActions = renderHook(useAlertsActions)
    const silenceActions = renderHook(useSilencesActions)

    // create local silences
    const silence = createFakeSilenceWith()
    act(() =>
      silenceActions.result.current.addLocalItem({
        silence: silence,
        id: "test1local",
        alertFingerprint: "12345",
      })
    )
    const silence2 = createFakeSilenceWith()
    act(() =>
      silenceActions.result.current.addLocalItem({
        silence: silence2,
        id: "test2local",
        alertFingerprint: "non_existing_alert",
      })
    )

    // check if the local silence are saved
    const { result: savedLocalSilences } = renderHook(useSilencesLocalItems)
    expect(Object.keys(savedLocalSilences.current).length).toEqual(2)

    // create an alert without any silencedBy so we just have the local silences
    const status = createFakeAlertStatustWith({
      silencedBy: ["test1local"],
    })
    const alert = createFakeAlertWith({ status: status, fingerprint: "12345" })
    act(() =>
      alertActions.result.current.setAlertsData({
        items: [alert],
        counts: countAlerts([alert]),
      })
    )

    // check if the alert is saved
    const { result: savedAlerts } = renderHook(useAlertsItems)
    expect(savedAlerts.current.length).toEqual(1)

    // trigger update local items by setting new external silences
    const externalSilence = createFakeSilenceWith({
      id: "different_id_then_test1local",
    })
    act(() =>
      silenceActions.result.current.setSilences({
        items: [externalSilence],
        itemsHash: { [externalSilence.id]: externalSilence },
        itemsByState: { active: [externalSilence] },
      })
    )

    // check local items
    expect(Object.keys(savedLocalSilences.current).length).toEqual(2)
    expect(savedLocalSilences.current["test1local"].id).toEqual("test1local")
    expect(savedLocalSilences.current["test2local"].id).toEqual("test2local")
  })
  describe("getMappedState", () => {
    beforeEach(() => {
      const advanced = renderHook(useSilencesAdvanced)
      act(() => advanced.result.current.resetSlice())
    })

    it("retuns supressed (processing) if a local silence is found", () => {
      const alertActions = renderHook(useAlertsActions)
      const silenceActions = renderHook(useSilencesActions)

      // create an alert with custom status
      const status = createFakeAlertStatustWith({
        silencedBy: ["external"],
      })
      const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
      // set the alert
      act(() =>
        alertActions.result.current.setAlertsData({
          items: [alert],
          counts: countAlerts([alert]),
        })
      )

      // create extern silences adding an id to the object
      const silence = createFakeSilenceWith({ id: "external" })
      act(() =>
        silenceActions.result.current.setSilences({
          items: [silence],
          itemsHash: { external: silence },
          itemsByState: { active: [silence] },
        })
      )

      // create local silence adding per attribute the id and the alert fingerprint
      const silence2 = createFakeSilenceWith()
      act(() =>
        silenceActions.result.current.addLocalItem({
          silence: silence2,
          id: "local",
          alertFingerprint: "123",
        })
      )

      // get mapping silences
      let mappingResult = null
      act(
        () =>
          (mappingResult = silenceActions.result.current.getMappedState(alert))
      )
      expect(mappingResult["type"]).toEqual("suppressed")
      expect(mappingResult["isProcessing"]).toEqual(true)
    })
    it("retuns just the alert.status.state if no local silences found", () => {
      const alertActions = renderHook(useAlertsActions)
      const silenceActions = renderHook(useSilencesActions)

      // create an alert with custom status
      const status = createFakeAlertStatustWith({
        silencedBy: ["external"],
      })
      const alert = createFakeAlertWith({ status: status, fingerprint: "123" })
      // set the alert
      act(() =>
        alertActions.result.current.setAlertsData({
          items: [alert],
          counts: countAlerts([alert]),
        })
      )

      // create extern silences adding an id to the object
      const silence = createFakeSilenceWith({ id: "external" })
      act(() =>
        silenceActions.result.current.setSilences({
          items: [silence],
          itemsHash: { external: silence },
          itemsByState: { active: [silence] },
        })
      )

      // get mapping silences
      let mappingResult = null
      act(
        () =>
          (mappingResult = silenceActions.result.current.getMappedState(alert))
      )
      expect(mappingResult["type"]).toEqual(alert?.status?.state)
      expect(mappingResult["isProcessing"]).toEqual(false)
    })
  })
})
