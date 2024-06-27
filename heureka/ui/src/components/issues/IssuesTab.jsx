/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import IssuesListController from "./IssuesListController"
import Filters from "../filters/Filters"

const IssuesTab = () => {
  return (
    <>
<<<<<<< HEAD
      {/* <Filters /> */}
=======
      <Filters />
>>>>>>> b74daa74 (feat(heureka): Substitute vulnerabilities with  issues tab using the new issueMatch entity (#175))
      <IssuesListController />
    </>
  )
}

export default IssuesTab
