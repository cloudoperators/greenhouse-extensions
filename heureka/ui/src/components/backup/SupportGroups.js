/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from "react"
import { Container } from "juno-ui-components"
import useStore from "../hooks/useStore"
import ServerGroupsList from "./SupportGroupsList"

const ITEMS_PER_PAGE = 10

const SupportGroups = () => {
  const endpoint = useStore(useCallback((state) => state.endpoint))

  return (
    <Container px={false}>
      <ServerGroupsList />
    </Container>
  )
}

export default SupportGroups
