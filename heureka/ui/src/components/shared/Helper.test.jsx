/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { highestSeverity, severityString } from "./Helper.jsx"

describe("highestSeverity", () => {
  it("should return the highest severity vulnerability", () => {
    const vulnerabilities = [
      { node: { severity: { score: 3, value: "Low" } } },
      { node: { severity: { score: 5, value: "Medium" } } },
      { node: { severity: { score: 7, value: "High" } } },
    ]
    const result = highestSeverity(vulnerabilities)
    expect(result).toEqual({ score: 7, value: "High" })
  })

  it("should return the first vulnerability if all have the same score", () => {
    const vulnerabilities = [
      { node: { severity: { score: 5, value: "Medium" } } },
      { node: { severity: { score: 5, value: "Medium" } } },
    ]
    const result = highestSeverity(vulnerabilities)
    expect(result).toEqual({ score: 5, value: "Medium" })
  })

  it("should ignore vulnerabilities with null severity scores", () => {
    const vulnerabilities = [
      { node: { severity: { score: null, value: "Unknown" } } },
      { node: { severity: { score: 4, value: "Low" } } },
    ]
    const result = highestSeverity(vulnerabilities)
    expect(result).toEqual({ score: 4, value: "Low" })
  })

  it("should ignore vulnerabilities with null severity scores", () => {
    const vulnerabilities = [
      { node: { severity: { score: null, value: null } } },
      { node: { severity: { score: 4, value: "Low" } } },
    ]
    const result = highestSeverity(vulnerabilities)
    expect(result).toEqual({ score: 4, value: "Low" })
  })

  it("should return undefined if vulnerabilities array is empty", () => {
    const vulnerabilities = []
    const result = highestSeverity(vulnerabilities)
    expect(result).toBeUndefined()
  })
})

describe("severityString", () => {
  it("should return the formatted severity string", () => {
    const severity = { score: 7, value: "High" }
    const result = severityString(severity)
    expect(result).toBe("High (7)")
  })

  it('should return "—" if severity value is missing', () => {
    const severity = { score: 7 }
    const result = severityString(severity)
    expect(result).toBe("—")
  })

  it('should return "—" if severity is undefined', () => {
    const result = severityString(undefined)
    expect(result).toBe("—")
  })

  it('should return "—" if severity is null', () => {
    const result = severityString(null)
    expect(result).toBe("—")
  })
})
