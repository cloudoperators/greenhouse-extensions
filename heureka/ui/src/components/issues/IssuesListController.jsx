/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import IssuesList from "./IssuesList"
import ListController from "../shared/ListController"

const IssuesListController = () => {
  return (
    <ListController
      queryKey="issues"
      entityName="IssueMatches"
      ListComponent={IssuesList}
    />
  )
}

export default IssuesListController
