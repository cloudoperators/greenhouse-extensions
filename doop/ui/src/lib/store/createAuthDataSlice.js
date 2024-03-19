/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const createAuthDataSlice = (set, get) => ({
  auth: {
    data: null,
    isProcessing: false,
    loggedIn: false,
    error: null,
    lastAction: {},
    appLoaded: false,
    appIsLoading: false,

    actions: {
      setAppLoaded: (appLoaded) => {
        set(
          (state) => ({ auth: { ...state.auth, appLoaded } }),
          false,
          "auth/setAppLoaded"
        )
      },
      setData: (data) => {
        set(
          (state) => ({
            auth: {
              ...state.auth,
              isProcessing: data?.isProcessing,
              loggedIn: data?.loggedIn,
              error: data?.error,
              data: data?.auth,
            },
          }),
          false,
          "auth/setData"
        )
      },
      setAction: (name) =>
        set(
          (state) => ({
            auth: {
              ...state.auth,
              lastAction: { name: name, updatedAt: Date.now() },
            },
          }),
          false,
          "auth/setAction"
        ),
      login: () => get().auth.actions.setAction(ACTIONS.SIGN_ON),
      logout: () => get().auth.actions.setAction(ACTIONS.SIGN_OUT),
    },
  },
})

export default createAuthDataSlice
