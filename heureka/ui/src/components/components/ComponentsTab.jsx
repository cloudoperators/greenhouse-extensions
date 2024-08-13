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
import { Container } from "@cloudoperators/juno-ui-components"

const ComponentsTab = () => {
  return (
    <>
      <MessagesProvider>
        <Filters />
        <Container py>
          <Messages />
        </Container>
        <ComponentsListController />
      </MessagesProvider>
    </>
  )
}

export default ComponentsTab
