/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useEffect } from "react"
import { useGlobalsActiveTab } from "../../hooks/useAppStore"

const TabPanel = ({ value, children }) => {
  const activeTab = useGlobalsActiveTab()

  // ATENTION!! compare with == since tabindex is int and value is string
  const displayChildren = useMemo(() => activeTab == value, [activeTab, value])

  return (
    <div style={{ display: displayChildren ? "inline" : "none" }}>
      {children}
    </div>
  )
}

export default TabPanel
