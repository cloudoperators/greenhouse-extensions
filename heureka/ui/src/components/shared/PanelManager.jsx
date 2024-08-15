/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Panel, Stack, PanelBody } from "@cloudoperators/juno-ui-components"
import {
  useActions,
  useShowPanel,
  useShowServiceDetail,
  useShowIssueDetail,
} from "../StoreProvider"
import ServicesDetail from "../services/ServicesDetail"
import constants from "./constants"
import IssuesDetails from "../issues/IssuesDetails"

const PanelManger = () => {
  const { setShowPanel, setShowServiceDetail, setShowIssueDetail } =
    useActions()
  const showPanel = useShowPanel()
  const showServiceDetail = useShowServiceDetail()
  const showIssueDetail = useShowIssueDetail()

  const onPanelClose = () => {
    setShowPanel(null)

    // clean up detail information
    setShowServiceDetail(null)
    setShowIssueDetail(null)
  }

  return (
    <Panel
      heading={
        <Stack gap="2">
          <span>
            {showPanel === constants.PANEL_SERVICE && showServiceDetail}
            {showPanel === constants.PANEL_ISSUE && "Detail"}
          </span>
        </Stack>
      }
      opened={!!useShowPanel()}
      onClose={() => onPanelClose()}
      size="large"
    >
      <PanelBody>
        {showPanel === constants.PANEL_SERVICE && <ServicesDetail />}

        {showPanel === constants.PANEL_ISSUE && <IssuesDetails />}
      </PanelBody>
    </Panel>
  )
}

export default PanelManger
