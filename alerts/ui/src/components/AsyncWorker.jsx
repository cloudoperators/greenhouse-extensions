/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import useCommunication from "../hooks/useCommunication"
import useAlertmanagerAPI from "../hooks/useAlertmanagerAPI"
import useUrlState from "../hooks/useUrlState"

const AsyncWorker = ({ endpoint }) => {
  useCommunication()
  useAlertmanagerAPI(endpoint)
  useUrlState()
  return null
}

export default AsyncWorker
