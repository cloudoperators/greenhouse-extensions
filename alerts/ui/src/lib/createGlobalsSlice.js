/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"

const createGlobalsSlice = (set, get) => ({
  globals: {
    embedded: false,
    showDetailsFor: null,
    apiEndpoint: null,
    activeSelectedTab: "alerts",

    actions: {
      setEmbedded: (embedded) =>
        set(
          (state) => ({ globals: { ...state.globals, embedded: embedded } }),
          false,
          "globals/setEmbedded"
        ),
      setShowDetailsFor: (alertID) =>
        set(
          (state) => ({
            // if the alertID is the same as the current one, we want to close the details panel again,
            // otherwise set the new alertID to replace the details in the panel
            globals: {
              ...state.globals,
              showDetailsFor:
                get().globals.showDetailsFor === alertID ? null : alertID,
            },
          }),
          false,
          "globals/setShowDetailsFor"
        ),
      setApiEndpoint: (endpoint) =>
        set(
          (state) => ({
            globals: { ...state.globals, apiEndpoint: endpoint },
          }),
          false,
          "globals/setShowDetailsFor"
        ),
      setActiveSelectedTab: (activeSelectedTab) =>
        set(
          (state) => ({
            globals: { ...state.globals, activeSelectedTab: activeSelectedTab },
          }),
          false,
          "globals/setShowDetailsFor"
        ),
    },
  },
})

export default createGlobalsSlice
