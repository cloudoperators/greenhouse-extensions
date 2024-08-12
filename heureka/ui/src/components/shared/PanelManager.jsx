/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Panel, Stack, PanelBody } from "@cloudoperators/juno-ui-components"
import { useActions, useShowPanel } from "../StoreProvider"
import ServicesDetail from "../services/ServicesDetail"
import constants from "./constants"

const PanelManger = () => {
  const { setShowPanel, useShowServiceDetail } = useActions()
  const showPanel = useShowPanel()

  const onPanelClose = () => {
    setShowPanel(null)

    // clean up detail information
    useShowServiceDetail(null)
  }

  const getServiceName = () => {
    return "ServiceName"
  }

  return (
    <Panel
      heading={
        <Stack gap="2">
          <span>
            {showPanel === constants.PANEL_SERVICE && getServiceName()}
          </span>
        </Stack>
      }
      opened={!!useShowPanel()}
      onClose={() => onPanelClose()}
      size="large"
    >
      <PanelBody>
        {showPanel === constants.PANEL_SERVICE && <ServicesDetail />}
      </PanelBody>
    </Panel>
  )
}

export default PanelManger
