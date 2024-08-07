/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import IssuesListController from "./IssuesListController"
import Filters from "../filters/Filters"
import { MessagesProvider } from "@cloudoperators/juno-messages-provider"

const IssuesTab = () => {
  return (
    <>
      <MessagesProvider>
        <Filters />
        <IssuesListController />
      </MessagesProvider>
    </>
  )
}

export default IssuesTab
