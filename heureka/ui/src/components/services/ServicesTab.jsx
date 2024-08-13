/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import ServicesListController from "./ServicesListController"
import Filters from "../filters/Filters"
import {
  Messages,
  MessagesProvider,
} from "@cloudoperators/juno-messages-provider"
import { Container } from "@cloudoperators/juno-ui-components"

const ServicesTab = () => {
  return (
    <>
      <MessagesProvider>
        <Filters queryKey="serviceFilters" />
        <Container py>
          <Messages />
        </Container>
        <ServicesListController />
      </MessagesProvider>
    </>
  )
}

export default ServicesTab
