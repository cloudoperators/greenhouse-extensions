/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"
import constants from "../../components/shared/constants"

const createGlobalsSlice = (set, get, options) => ({
  globals: {
    embedded: false, //Set to true if app is to be embedded in another existing app or page.
    apiEndpoint: options?.apiEndpoint, //The API endpoint to use for fetching data.
    isUrlStateSetup: false, //Set to true when the URL state has been set up.
    queryClientFnReady: false, //Set to true when the queryClient function is ready to be used.
    activeTab: "Services", //Set to the active tab.
    showPanel: constants.PANEL_NONE, //Set to the which panel should be shown (e.g service details panel, issue matches details panel and so on), if any.

    showServiceDetail: null,
    showIssueDetail: null,
    tabs: {
      Services: {
        queryOptions: {
          first: 20,
        },
      },
      IssueMatches: {
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
      setShowPanel: (panel) =>
        set(
          (state) => ({
            globals: { ...state.globals, showPanel: panel },
          }),
          false,
          "globals/setShowPanel"
        ),
      setShowServiceDetail: (serviceId) =>
        set(
          (state) => ({
            globals: { ...state.globals, showServiceDetail: serviceId },
          }),
          false,
          "globals/setShowServiceDetail"
        ),

      setShowIssueDetail: (issueName) =>
        set(
          (state) => ({
            globals: { ...state.globals, showIssueDetail: issueName },
          }),
          false,
          "globals/setShowIssueDetail"
        ),
    },
  },
})

export default createGlobalsSlice
