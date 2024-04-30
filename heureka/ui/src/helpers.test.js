/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseError, classifyVulnerabilities } from "./helpers"

describe("Helpers", () => {
  describe("parseError", () => {
    test("return error as string if no object with message", () => {
      expect(parseError({ error: "This is an error text" })).toEqual(
        '{"error":"This is an error text"}'
      )
    })
    test("return error message if object with message attr exists", () => {
      expect(parseError({ message: "This is an error text" })).toEqual(
        "This is an error text"
      )
    })
    test("return error message if object message has attr msg", () => {
      expect(
        parseError({ message: '{ "msg": "This is an error text" }' })
      ).toEqual("This is an error text")
    })
    test("return error message if object message has attr error", () => {
      expect(
        parseError({ message: '{ "error": "This is an error text" }' })
      ).toEqual("This is an error text")
    })
    test("return standard error message if no object message available", () => {
      expect(parseError({})).toEqual(
        "An error occurred. There is no further information"
      )
    })
    test("return standard error message if no object message available", () => {
      expect(parseError()).toEqual(
        "An error occurred. There is no further information"
      )
    })
    test("return error text if just a string is available", () => {
      expect(parseError("This is a mega error")).toEqual(
        '"This is a mega error"'
      )
    })
  })

  describe("classifyVulnerabilities", () => {
    test("return empty results if no components provided", () => {
      expect(classifyVulnerabilities(classifyVulnerabilities)).toEqual({
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      })
    })
    test("return empty results if null provided", () => {
      expect(classifyVulnerabilities(null)).toEqual({
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      })
    })
    test("map to array if object instead of array provided", () => {
      expect(
        classifyVulnerabilities({
          Vulnerabilities: [{ ThreatLevelOverall: "Medium" }],
        })
      ).toEqual({
        low: 0,
        medium: 1,
        high: 0,
        critical: 0,
      })
    })
    test("classify all possibilities with and without capital letter", () => {
      const component1 = {
        Vulnerabilities: [
          { ThreatLevelOverall: "High" },
          { ThreatLevelOverall: "Low" },
        ],
      }
      const component2 = {
        Vulnerabilities: [
          { ThreatLevelOverall: "Critical" },
          { ThreatLevelOverall: "Medium" },
        ],
      }
      const component3 = {
        Vulnerabilities: [{ ThreatLevelOverall: "medium" }],
      }
      expect(
        classifyVulnerabilities([component1, component2, component3])
      ).toEqual({
        low: 1,
        medium: 2,
        high: 1,
        critical: 1,
      })
    })
  })
})
