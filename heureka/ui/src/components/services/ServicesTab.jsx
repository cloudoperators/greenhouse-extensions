/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import ServicesListController from "./ServicesListController"
import Filters from "../filters/Filters"

const ServicesTab = () => {
  return (
    <>
      <Filters queryKey="serviceFilters" />
      <ServicesListController />
    </>
  )
}

export default ServicesTab
