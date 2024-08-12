/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Panel, Stack, PanelBody } from "@cloudoperators/juno-ui-components"
import { useActions, useShowServiceDetail } from "../StoreProvider"

const ServicesDetail = () => {
  const showServiceDetail = useShowServiceDetail()

  return (
    <>
      <p>Details for {showServiceDetail}</p>
    </>
  )
}

export default ServicesDetail
