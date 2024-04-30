/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setupMatchers } from "./silenceHelpers"

describe("helpers", () => {
  describe("setupMatchers", () => {
    test("mark excluded labels and ignore enriched labels", () => {
      const alertLables = {
        region: "test-1",
        service: "compute",
        severity: "critical",
        pod: "node014",
        status: "active",
      }
      const matchers = setupMatchers(alertLables, ["pod"], ["status"])
      expect(matchers).toEqual([
        {
          name: "region",
          value: "test-1",
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
          value: "node014",
          isRegex: false,
          excluded: true,
          configurable: true,
        },
      ])
    })
  })
})
