/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import ServicesList from "./ServicesList"
import ListController from "../shared/ListController"

const ServicesListController = () => {
  return (
    <ListController
      queryKey="Services"
      entityName="Services"
      ListComponent={ServicesList}
    />
  )
}

export default ServicesListController
