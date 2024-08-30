/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import IssueMatchesList from "./IssueMatchesList"
import ListController from "../shared/ListController"

const IssueMatchesListController = () => {
  return (
    <ListController
      queryKey="IssueMatches"
      entityName="IssueMatches"
      ListComponent={IssueMatchesList}
    />
  )
}

export default IssueMatchesListController
