/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"

const createGlobalsSlice = (set, get, options) => ({
  globals: {
    embedded: false,
    apiEndpoint: options?.apiEndpoint,
    isUrlStateSetup: false,
    queryClientFnReady: false,
    bearerToken: options?.bearerToken,
    activeTab: "services",
    tabs: {
      Services: {
        queryOptions: {
          first: 20,
        },
      },
      Issues: {
        queryOptions: {
          first: 20,
        },
      },
      Components: {
        queryOptions: {
          first: 20,
        },
      },
    },

    actions: {
      setQueryClientFnReady: (readiness) =>
        set(
          produce((state) => {
            state.globals.queryClientFnReady = readiness
          }),
          false,
          "globals/setQueryClientFnReady"
        ),

      setQueryOptions: (tab, options) =>
        set(
          produce((state) => {
            state.globals.tabs[tab].queryOptions = options
          }),
          false,
          "globals/setQueryOptions"
        ),
      setEmbedded: (embedded) =>
        set(
          (state) => ({ globals: { ...state.globals, embedded: embedded } }),
          false,
          "globals/setEmbedded"
        ),
      setApiEndpoint: (apiEndpoint) =>
        set(
          (state) => ({
            globals: { ...state.globals, apiEndpoint: apiEndpoint },
          }),
          false,
          "globals/setApiEndpoint"
        ),
      setActiveTab: (activeTab) =>
        set(
          (state) => ({
            globals: { ...state.globals, activeTab: activeTab },
          }),
          false,
          "globals/setActiveTab"
        ),
    },
  },
})

export default createGlobalsSlice
