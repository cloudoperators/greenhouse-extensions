/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"
import {
  MainTabs,
  TabList,
  Tab,
  TabPanel,
  Icon,
  Container,
} from "juno-ui-components"
import { useRouter } from "url-state-router"
import Breadcrumb from "./Breadcrumb"
import { Messages } from "messages-provider"

const AppContainer = ({ tabsConfig, component, children }) => {
  const { navigateTo, currentPath } = useRouter()

  const tabIndex = useMemo(() => {
    if (!currentPath) return 0
    return tabsConfig.findIndex((tab) => currentPath.startsWith(tab.path))
  }, [currentPath])

  return (
    <>
      <MainTabs selectedIndex={tabIndex}>
        <TabList>
          {tabsConfig.map((tab, index) => (
            <Tab key={index} onClick={() => navigateTo(tab.path)}>
              <Icon className="mr-2" icon={tab.icon} />
              {tab.label}
            </Tab>
          ))}
        </TabList>
        {tabsConfig.map((tab, index) => (
          <TabPanel key={index} />
        ))}
        <Container>
          <Breadcrumb />
          <Messages />
          {component || children}
        </Container>
      </MainTabs>
    </>
  )
}

export default AppContainer
