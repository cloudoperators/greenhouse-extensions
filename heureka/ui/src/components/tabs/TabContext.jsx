/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import { Container, TabNavigation, TabNavigationItem } from "juno-ui-components"
import TabPanel from "./TabPanel"
import { useActions, useActiveTab } from "../StoreProvider"

import ServicesTab from "../services/ServicesTab"
import IssuesTab from "../issues/IssuesTab"
import ComponentsTab from "../components/ComponentsTab"

const TAB_CONFIG = [
  {
    label: "Services",
    value: "services",
    icon: "dns",
    component: ServicesTab,
  },
  {
    label: "Issues",
    value: "issues",
    icon: "autoAwesomeMotion",
    component: IssuesTab,
  },
  {
    label: "Components",
    value: "components",
    icon: "autoAwesomeMotion",
    component: ComponentsTab,
  },
]

const TabContext = () => {
  const { setActiveTab } = useActions()
  const activeTab = useActiveTab()

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
