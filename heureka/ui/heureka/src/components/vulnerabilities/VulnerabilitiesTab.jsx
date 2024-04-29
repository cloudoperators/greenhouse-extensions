/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import VulnerabilitiesListController from "./VulnerabilitiesListController"
import Filters from "../filters/Filters"

const VulnerabilitiesTab = () => {
  return (
    <>
      <Filters />
      <VulnerabilitiesListController />
    </>
  )
}

export default VulnerabilitiesTab
