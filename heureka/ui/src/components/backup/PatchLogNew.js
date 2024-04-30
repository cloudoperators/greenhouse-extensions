/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from "react"
import {
  Button,
  Panel,
  PanelBody,
  PanelFooter,
  Form,
  TextInputRow,
} from "juno-ui-components"
import { useRouter } from "url-state-router"
import { getService } from "../queries"
import useStore from "../hooks/useStore"
import ChangesLogList from "./ChangesLogList"
import { SERVICES_PATH } from "./AppRouter"
import { changeLogExample1, changeLogExample2 } from "../helpers"

const PatchLogNew = ({}) => {
  const { options, routeParams, navigateTo } = useRouter()
  const serviceId = routeParams?.serviceId
  const endpoint = useStore(useCallback((state) => state.endpoint))
  const auth = useStore(useCallback((state) => state.auth))

  const changes = useMemo(() => {
    return [changeLogExample1, changeLogExample2]
  }, [])

  const onPanelClose = () => {
    navigateTo(`${SERVICES_PATH}/${serviceId}`)
  }

  const formPanelFooter = useMemo(
    () => (
      <PanelFooter>
        <Button onClick={onPanelClose} variant="subdued">
          Cancel
        </Button>
        <Button
          className="ml-2"
          onClick={function noRefCheck() {}}
          variant="primary"
          // disabled={isFormLoading}
          // progress={isFormLoading}
        >
          Create
        </Button>
      </PanelFooter>
    ),
    []
  )

  return (
    <Panel heading="New patch log" opened={true} onClose={onPanelClose}>
      <PanelBody footer={formPanelFooter}>
        <Form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <p className="font-bold mb-1">Components</p>
          <ChangesLogList selectable changes={changes} />

          <TextInputRow label="Actual remediation" required />
          <TextInputRow label="Planned remediation" />
          <TextInputRow label="Target remediation" />
        </Form>
      </PanelBody>
    </Panel>
  )
}

export default PatchLogNew
