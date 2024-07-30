/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, useLayoutEffect } from "react"
import { Panel, PanelBody, Message } from "@cloudoperators/juno-ui-components"
import {
  useDataDetailsViolationGroupKind,
  useDataActions,
} from "../StoreProvider"
import HintLoading from "../shared/HintLoading"
import ViolationDetailsList from "./ViolationDetailsList"
import Filters from "../filters/Filters"

const ViolationDetails = () => {
  const detailsViolationGroupKind = useDataDetailsViolationGroupKind()
  const { setDetailsViolationGroupKind } = useDataActions()
  const [showContent, setShowContent] = useState(false)

  // reset the scroll position when the detailsViolationGroup changes and display the loading indicator
  useLayoutEffect(() => {
    setShowContent(false)
  }, [detailsViolationGroupKind])

  useEffect(() => {
    if (!detailsViolationGroupKind) return
    setShowContent(true)
  }, [detailsViolationGroupKind])

  return (
    <Panel
      heading={`Check: ${detailsViolationGroupKind}`}
      onClose={() => {
        setDetailsViolationGroupKind(null)
      }}
      opened={!!detailsViolationGroupKind}
      size="large"
    >
      <PanelBody>
        {showContent ? (
          <>
            <Filters />
            <ViolationDetailsList />
          </>
        ) : (
          <>{detailsViolationGroupKind && <HintLoading />}</>
        )}
      </PanelBody>
    </Panel>
  )
}

export default ViolationDetails
