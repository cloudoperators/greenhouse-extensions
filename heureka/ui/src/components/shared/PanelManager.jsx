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
} from "../StoreProvider"
import ServicesDetail from "../services/ServicesDetail"
import constants from "./constants"

const PanelManger = () => {
  const { setShowPanel, setShowServiceDetail } = useActions()
  const showPanel = useShowPanel()
  const showServiceDetail = useShowServiceDetail()

  const onPanelClose = () => {
    setShowPanel(null)

    // clean up detail information
    setShowServiceDetail(null)
  }

  return (
    <Panel
      heading={
        <Stack gap="2">
          <span>
            {showPanel === constants.PANEL_SERVICE && showServiceDetail}
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
