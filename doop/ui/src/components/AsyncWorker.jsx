/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import useUrlState from "../hooks/useUrlState"
import useCommunication from "../hooks/useCommunication"

const AsyncWorker = ({ consumerId }) => {
  useUrlState(consumerId)
  useCommunication()

  return null
}

export default AsyncWorker
