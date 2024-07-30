/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react"
import { Container } from "@cloudoperators/juno-ui-components"
import { Messages } from "@cloudoperators/juno-messages-provider"

import { useActions } from "@cloudoperators/juno-messages-provider"
import { useDataActions } from "./StoreProvider"
import Header from "./Header"
import HintLoading from "./shared/HintLoading"
import { useQuery } from "@tanstack/react-query"
import { fetchData } from "../lib/apiClient"
import { parseError } from "../lib/helpers"
import Highlighter from "./Highlighter"
import Violations from "./violations/violations"
import { fetchProxy } from "@cloudoperators/juno-utils"
import { useGlobalsMock, useGlobalsEndpoint } from "./StoreProvider"

const AppContent = ({ id, showDebugSeverities }) => {
  const { setData, setShowDebugSeverities } = useDataActions()
  const { addMessage } = useActions()
  const isMock = useGlobalsMock()
  const endpoint = useGlobalsEndpoint()

  useEffect(() => {
    if (isMock) {
      fetchProxy(`${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...{ mock: true },
      })
        .then((response) => {
          if (!response.ok) {
            addMessage({
              variant: "error",
              text: parseError(e.message),
            })
          }
          return response.json()
        })
        .then((result) => {
          setData(result)
        })
    }
  }, [isMock])

  // LOAD DATA
  const dataRequest = useQuery({
    queryKey: ["violations"],
    queryFn: fetchData,
    enabled: !isMock,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  // USE DATA
  useEffect(() => {
    setShowDebugSeverities(!!showDebugSeverities)
    if (dataRequest.error) {
      addMessage({
        variant: "error",
        text: parseError(dataRequest.error),
      })
    } else if (!dataRequest.isLoading && !dataRequest.data) {
      addMessage({
        variant: "Info",
        text: "No data available",
      })
    } else {
      // save the new data fetched from the API.
      setData(dataRequest.data)
    }
  }, [dataRequest, setData, addMessage, setShowDebugSeverities])

  return (
    <Container py>
      {/* <UrlStateManager consumerId={id || "doop"} /> */}
      <Header />
      <Messages className="mb-4" />
      {dataRequest?.isLoading && !isMock ? (
        <HintLoading className="tw-mt-4" />
      ) : (
        <Violations />
      )}
      <Highlighter />
    </Container>
  )
}

export default AppContent
