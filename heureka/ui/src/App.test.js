/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { render } from "@testing-library/react"
// support shadow dom queries
// https://reactjsexample.com/an-extension-of-dom-testing-library-to-provide-hooks-into-the-shadow-dom/
import { screen } from "shadow-dom-testing-library"
import App from "./App"

jest.mock("communicator")

describe("logged in", () => {
  test("renders app", async () => {
    render(<App />)
    const loginTitle = await screen.queryAllByShadowText(/Converged Cloud/i)
    expect(loginTitle.length > 0).toBe(true)
  })
})
