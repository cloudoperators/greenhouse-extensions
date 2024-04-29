/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createStore } from "zustand"
import { devtools } from "zustand/middleware"
import produce from "immer"

export default (options) =>
  createStore(
    devtools((set, get) => ({
      isUrlStateSetup: false,
      queryClientFnReady: false,
      endpoint: options?.apiEndpoint,

      activeTab: "services",
      tabs: {
        services: {
          queryOptions: {
            first: 20,
          },
        },
        vulnerabilities: {
          queryOptions: {
            first: 20,
          },
        },
      },

      actions: {
        setQueryClientFnReady: (readiness) =>
          set(
            (state) => {
              state.queryClientFnReady = readiness
            },
            false,
            "setQueryClientFnReady"
          ),
        setActiveTab: (index) =>
          set(
            (state) => {
              state.activeTab = index
            },
            false,
            "setActiveTab"
          ),
        setQueryOptions: (tab, options) =>
          set(
            produce((state) => {
              state.tabs[tab].queryOptions = options
            }),
            false,
            "setQueryOptions"
          ),
      },
    }))
  )
