/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createStore } from "zustand"
import { devtools } from "zustand/middleware"
import { produce } from "immer"
import constants from "../components/shared/constants"

export default (options) =>
  createStore(
    devtools((set, get) => ({
      isUrlStateSetup: false,
      queryClientFnReady: false,
      endpoint: options?.apiEndpoint,

      showPanel: constants.PANEL_NONE,

      showServiceDetail: null,
      showIssueDetail: null,

      activeTab: "services",
      tabs: {
        services: {
          queryOptions: {
            first: 20,
          },
        },
        issues: {
          queryOptions: {
            first: 20,
          },
        },
        components: {
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
        setShowPanel: (panel) =>
          set(
            produce((state) => {
              state.showPanel = panel
            }),
            false,
            "setShowPanel"
          ),
        setShowServiceDetail: (serviceId) =>
          set(
            produce((state) => {
              state.showServiceDetail = serviceId
            }),
            false,
            "setShowServiceDetail"
          ),

        setShowIssueDetail: (issueName) =>
          set(
            produce((state) => {
              state.showIssueDetail = issueName
            }),
            false,
            "setShowIssueDetail"
          ),
      },
    }))
  )
