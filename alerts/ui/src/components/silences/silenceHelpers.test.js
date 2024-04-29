/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setupMatchers } from "./silenceHelpers"

describe("helpers", () => {
  describe("setupMatchers", () => {
    test("mark excluded labels and ignore enriched labels", () => {
      const alertLables = {
        region: "na-us-1",
        service: "compute",
        severity: "critical",
        pod: "node014-bb164.cc.na-us-1.cloud.sap",
        status: "active",
      }
      const matchers = setupMatchers(alertLables, ["pod"], ["status"])
      expect(matchers).toEqual([
        {
          name: "region",
          value: "na-us-1",
          isRegex: false,
          excluded: false,
          configurable: false,
        },
        {
          name: "service",
          value: "compute",
          isRegex: false,
          excluded: false,
          configurable: false,
        },
        {
          name: "severity",
          value: "critical",
          isRegex: false,
          excluded: false,
          configurable: false,
        },
        {
          name: "pod",
          value: "node014-bb164.cc.na-us-1.cloud.sap",
          isRegex: false,
          excluded: true,
          configurable: true,
        },
      ])
    })
  })
})
