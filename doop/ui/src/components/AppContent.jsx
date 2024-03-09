import React, { useEffect } from "react"
import { Container } from "juno-ui-components"
import { Messages } from "messages-provider"

import { useActions } from "messages-provider"
import { useDataActions } from "./StoreProvider"
import Header from "./Header"
import HintLoading from "./shared/HintLoading"
import { useQuery } from "@tanstack/react-query"
import { fetchData } from "../lib/apiClient"
import { parseError } from "../lib/helpers"
import Highlighter from "./Highlighter"
import Violations from "./violations/violations"

const AppContent = ({ id, showDebugSeverities }) => {
  const { setData, setShowDebugSeverities } = useDataActions()
  const { addMessage } = useActions()

  // LOAD DATA
  const dataRequest = useQuery({
    queryKey: ["violations"],
    queryFn: fetchData,
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

      {dataRequest?.isLoading ? (
        <HintLoading className="tw-mt-4" />
      ) : (
        <Violations />
      )}
      <Highlighter />
    </Container>
  )
}

export default AppContent
