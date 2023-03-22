import { countTotalSeverities, countSeveritiesPerRegion } from "./alertHelpers"

describe("Alert Helpers", () => {
  describe("countTotalSeverities", () => {
    test("return empty object if no object given", () => {
      expect(countTotalSeverities()).toEqual({})
    })
  })
  describe("countSeveritiesPerRegion", () => {
    test("return empty object if no object given", () => {
      expect(countSeveritiesPerRegion()).toEqual({})
    })
  })
})
