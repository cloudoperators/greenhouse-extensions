/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import ComponentsListController from "./ComponentsListController"
import Filters from "../filters/Filters"
import {
  Messages,
  MessagesProvider,
} from "@cloudoperators/juno-messages-provider"

const ComponentsTab = () => {
  return (
    <>
      <MessagesProvider>
        <Messages />
        {/* <Filters queryKey={ComponentFilterValues} />  // Should be activated after BE respective implementation*/}
        <ComponentsListController />
      </MessagesProvider>
    </>
  )
}

export default ComponentsTab
