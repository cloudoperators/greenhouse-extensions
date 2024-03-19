/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { render, act, waitFor } from "@testing-library/react"
// support shadow dom queries
// https://reactjsexample.com/an-extension-of-dom-testing-library-to-provide-hooks-into-the-shadow-dom/
import { screen } from "shadow-dom-testing-library"
import App from "./App"

// Mock BroadcastChannel
globalThis.BroadcastChannel = jest.fn(() => ({
  postMessage: jest.fn(),
  close: jest.fn(),
}))

test("renders app", async () => {
  await act(() => render(<App />))

  let loginTitle = await screen.queryAllByShadowText(/DOOP/i)

  expect(loginTitle.length > 0).toBe(true)
})
