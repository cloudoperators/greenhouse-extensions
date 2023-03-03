import React, { useMemo } from "react"
import {
  Button,
  ContentAreaToolbar,
  Container,
  Message,
  Spinner,
  Stack,
} from "juno-ui-components"
import useStore from "./store"
import { queryAlerts } from "./queries"

import { currentState, push } from "url-state-provider"
import AlertsList from "./components/alerts/AlertsList"

const AppContent = (props) => {
  const urlStateKey = useStore((state) => state.urlStateKey)

  const { isLoading, isError, data, error } = queryAlerts()

  // const openNewItemForm = () => {
  //   const urlState = currentState(urlStateKey)
  //   push(urlStateKey, { ...urlState, newItemFormOpened: true })
  // }

  const { totalCount, criticalCount, warningCount, infoCount } = useMemo(() => {
    if (!data)
      return { totalCount: 0, criticalCount: 0, warningCount: 0, infoCount: 0 }
    let totalCount = data.length
    let criticalCount = data.reduce(
      (critical, item) =>
        item.labels?.severity === "critical" ? ++critical : critical,
      0
    )
    let warningCount = data.reduce(
      (warning, item) =>
        item.labels?.severity === "warning" ? ++warning : warning,
      0
    )
    let infoCount = data.reduce(
      (info, item) => (item.labels?.severity === "info" ? ++info : info),
      0
    )

    return { totalCount, criticalCount, warningCount, infoCount }
  }, [data])

  return (
    <Container px py className="h-full">
      {isError && (
        <Message variant="danger" className="mb-4">
          {`${error.statusCode}, ${error.message}`}
        </Message>
      )}

      {/* Add a toolbar  */}
      {data && (
        <div className="bg-theme-background-lvl-2 py-1.5 px-4">
          <span className="text-theme-high pr-2">{`${totalCount} alerts`}</span>
          <span>{`(${criticalCount} critical, ${warningCount} warning, ${infoCount} info)`}</span>
        </div>
      )}

      {isLoading && (
        <Stack gap="2">
          <span>Loading</span>
          <Spinner variant="primary" />
        </Stack>
      )}

      <AlertsList />
    </Container>
  )
}

export default AppContent
