/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  Container,
  TabNavigation,
  TabNavigationItem,
} from "@cloudoperators/juno-ui-components"
import TabPanel from "./TabPanel"
import { useGlobalsActions, useGlobalsActiveTab } from "../../hooks/useAppStore"

import ServicesTab from "../services/ServicesTab"
import IssueMatchesTab from "../issueMatches/IssueMatchesTab"
import ComponentsTab from "../components/ComponentsTab"

const TAB_CONFIG = [
  {
    label: "Services",
    value: "Services",
    icon: "dns",
    component: ServicesTab,
  },
  {
    label: "IssueMatches",
    value: "IssueMatches",
    icon: "autoAwesomeMotion",
    component: IssueMatchesTab,
  },
  {
    label: "Components",
    value: "Components",
    icon: "autoAwesomeMotion",
    component: ComponentsTab,
  },
]

const TabContext = () => {
  const { setActiveTab } = useGlobalsActions()
  const activeTab = useGlobalsActiveTab()

  const memoizedTabs = useMemo(
    () =>
      TAB_CONFIG.map((tab) => (
        <TabNavigationItem
          key={tab.value}
          icon={tab.icon}
          label={tab.label}
          value={tab.value}
        />
      )),
    []
  )

  const memoizedTabPanels = useMemo(
    () =>
      TAB_CONFIG.map((tab) => (
        <TabPanel key={tab.value} value={tab.value}>
          <tab.component />
        </TabPanel>
      )),
    []
  )

  return (
    <>
      <TabNavigation
        activeItem={activeTab}
        onActiveItemChange={(value) => setActiveTab(value)}
      >
        {memoizedTabs}
      </TabNavigation>
      <Container py>{memoizedTabPanels}</Container>
    </>
  )
}

export default TabContext
