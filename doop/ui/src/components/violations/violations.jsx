/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { useDataLoaded } from "../StoreProvider"
import ViolationsList from "./ViolationsList"
import Filters from "../filters/Filters"
import ViolationDetails from "./ViolationDetails"

const Violations = () => {
  const loaded = useDataLoaded()

  return (
    <>
      {loaded ? (
        <>
          <Filters />
          <ViolationsList />
          <ViolationDetails />
        </>
      ) : (
        <span>Could not load data</span>
      )}
    </>
  )
}

export default Violations
