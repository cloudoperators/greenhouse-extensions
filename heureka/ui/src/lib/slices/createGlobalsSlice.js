/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"
import constants from "../../components/shared/constants"

const createGlobalsSlice = (set, get, options) => ({
  globals: {
    embedded: false,
    apiEndpoint: options?.apiEndpoint,
    isUrlStateSetup: false,
    queryClientFnReady: false,
    bearerToken: options?.bearerToken,
    activeTab: "Services",
    showPanel: constants.PANEL_NONE,

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
          // set(
          //   produce((state) => {
          //     state.showPanel = panel
          //   }),
          false,
          "globals/setShowPanel"
        ),
      setShowServiceDetail: (serviceId) =>
        set(
          (state) => ({
            globals: { ...state.globals, showServiceDetail: serviceId },
          }),
          // set(
          //   produce((state) => {
          //     state.showServiceDetail = serviceId
          //   }),
          false,
          "globals/setShowServiceDetail"
        ),

      setShowIssueDetail: (issueName) =>
        set(
          (state) => ({
            globals: { ...state.globals, showIssueDetail: issueName },
          }),
          // set(
          //   produce((state) => {
          //     state.showIssueDetail = issueName
          //   }),
          false,
          "globals/setShowIssueDetail"
        ),
    },
  },
})

export default createGlobalsSlice
