/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createStore } from "zustand"
import { devtools } from "zustand/middleware"
import createDataSlice from "./createDataSlice"
import createFiltersSlice from "./createFiltersSlice"
import createAuthDataSlice from "./createAuthDataSlice"
import createUserActivitySlice from "./createUserActivitySlice"
import createGlobalsSlice from "./createGlobalsSlice"

export default () =>
  createStore(
    devtools((set, get) => ({
      ...createUserActivitySlice(set, get),
      ...createAuthDataSlice(set, get),
      ...createFiltersSlice(set, get),
      ...createDataSlice(set, get),
      ...createGlobalsSlice(set, get),
    }))
  )
