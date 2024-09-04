/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from "immer"

const createUserActivitySlice = (set, get) => ({
  userActivity: {
    isActive: true,

    actions: {
      setIsActive: (activity) => {
        set(
          (state) => ({
            userActivity: { ...state.userActivity, isActive: activity },
          }),
          false,
          "userActivity.setIsActive"
        )
      },
    },
  },
})

export default createUserActivitySlice
