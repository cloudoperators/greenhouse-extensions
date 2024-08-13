/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import ComponentsList from "./ComponentsList"
import ListController from "../shared/ListController"

const ComponentsListController = () => {
  return (
    <ListController
      queryKey="components"
      entityName="Components"
      ListComponent={ComponentsList}
    />
  )
}

export default ComponentsListController
