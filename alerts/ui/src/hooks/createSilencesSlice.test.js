import { renderHook, act, waitFor } from "@testing-library/react"
import {
  useSilencesActions,
  useSilencesLocalItems,
  useAlertsActions,
  useAlertsItems,
} from "./useStore"
import {
  createFakeAlertStatustWith,
  createFakeAlertWith,
  createFakeSilenceWith,
} from "./fakeObjects"
import { countAlerts } from "../lib/utils"

describe("createSilencesSlice", () => {
  describe("addLocalItem", () => {
    it("should append the object with key silence id and value the silence itself", () => {
      const actions = renderHook(useSilencesActions)

      const silence = createFakeSilenceWith({ id: "test" })

      act(() => actions.result.current.addLocalItem(silence))

      const { result } = renderHook(useSilencesLocalItems)
      waitFor(() => {
        expect(result.current).toEqual({ test: silence })
      })
    })
    it("should avoid to add any silences without id", () => {
      const actions = renderHook(useSilencesActions)

      const silence = createFakeSilenceWith({ id: "" })
      const silence2 = createFakeSilenceWith({ id: null })

      act(() => actions.result.current.addLocalItem(silence))
      act(() => actions.result.current.addLocalItem(silence2))

      const { result } = renderHook(useSilencesLocalItems)
      waitFor(() => {
        expect(result.current).toEqual({})
      })
    })
  }),
    describe("updateLocalItems", () => {
      it("return default empty object if not items to update", () => {
        const actions = renderHook(useSilencesActions)

        act(() => actions.result.current.updateLocalItems())

        const { result } = renderHook(useSilencesLocalItems)
        waitFor(() => {
          expect(result.current).toEqual({})
        })
      })

      it("removes local silences whose alert reference has a silencedBy with the silence id itself", () => {
        const alertActions = renderHook(useAlertsActions)
        const silenceActions = renderHook(useSilencesActions)

        // create an alert without any silencedBy
        const status = createFakeAlertStatustWith({ silencedBy: [] })
        const alert = createFakeAlertWith({ status: status })

        // create a silence
        const silence = createFakeSilenceWith({
          id: "test1",
          alertFingerPrint: alert.fingerprint,
        })
        const silence2 = createFakeSilenceWith({ id: "test2" })

        // set the alert
        act(() =>
          alertActions.result.current.setAlertsData({
            items: [alert],
            counts: countAlerts([alert]),
          })
        )

        // check if the alert is saved
        const { result: savedAlerts } = renderHook(useAlertsItems)
        waitFor(() => {
          expect(savedAlerts.current).toBe(1)
        })

        // set the silence
        act(() => silenceActions.result.current.addLocalItem(silence))
        act(() => silenceActions.result.current.addLocalItem(silence2))

        // check if the silence and alert are saved
        const { result: savedLocalSilences } = renderHook(useSilencesLocalItems)
        waitFor(() => {
          expect(savedLocalSilences.current).toBe(2)
        })

        // update local items
        act(() => silenceActions.result.current.updateLocalItems())
        waitFor(() => {
          expect(savedLocalSilences.current).toBe(1)
          expect(savedLocalSilences.current.id).toEqual("test2")
        })
      })
    })
})
