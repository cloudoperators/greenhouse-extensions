/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import IssueMatchesListController from "./IssueMatchesListController"
import Filters from "../filters/Filters"
import {
  Messages,
  MessagesProvider,
} from "@cloudoperators/juno-messages-provider"

const IssuesTab = () => {
  return (
    <>
      <MessagesProvider>
        <Messages />
        <Filters queryKey="IssueMatchFilterValues" entityName="IssueMatches" />
        <IssueMatchesListController />
      </MessagesProvider>
    </>
  )
}

export default IssuesTab
