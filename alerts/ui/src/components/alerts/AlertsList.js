import React, { useMemo, useState, useRef, useCallback } from "react"
import {
  DataGrid,
  DataGridHeadCell,
  DataGridRow,
  DataGridCell,
  Icon,
} from "juno-ui-components"
import Alert from "./Alert"
import useStore from "../../hooks/useStore"

const AlertsList = () => {
  const [visibleAmount, setVisibleAmount] = useState(20)
  const [isAddingItems, setIsAddingItems] = useState(false)
  const timeoutRef = React.useRef(null)

  // const { isLoading, isError, data, error } = queryAlerts()
  const alerts = useStore((state) => state.alerts)

  const alertsSorted = useMemo(() => {
    if (alerts?.items) {
      return alerts.items.slice(0, visibleAmount)
    }
  }, [alerts, visibleAmount])

  React.useEffect(() => {
    return () => clearTimeout(timeoutRef.current) // clear when component is unmounted
  }, [])

  const observer = useRef()
  const lastListElementRef = useCallback(
    (node) => {
      // no fetch if loading original data
      if (alerts.isLoading || isAddingItems) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        console.log("IntersectionObserver: callback")
        if (entries[0].isIntersecting && visibleAmount <= alertsSorted.length) {
          // setVisibleAmount((prev) => prev + 10)
          clearTimeout(timeoutRef.current)
          setIsAddingItems(true)
          timeoutRef.current = setTimeout(() => {
            setIsAddingItems(false)
            setVisibleAmount((prev) => prev + 10)
          }, 500)
        }
      })
      if (node) observer.current.observe(node)
    },
    [alerts.isLoading, isAddingItems]
  )

  return (
    <DataGrid columns={7} minContentColumns={[0, 2, 5]} cellVerticalAlignment="top">
      {!alerts.isLoading && (
        <DataGridRow>
          <DataGridHeadCell>
            <Icon icon="monitorHeart" />
          </DataGridHeadCell>
          <DataGridHeadCell>Region</DataGridHeadCell>
          <DataGridHeadCell>Service</DataGridHeadCell>
          <DataGridHeadCell>Description</DataGridHeadCell>
          <DataGridHeadCell>Firing Since</DataGridHeadCell>
          <DataGridHeadCell>Status</DataGridHeadCell>
          <DataGridHeadCell></DataGridHeadCell>
        </DataGridRow>
      )}
      {alertsSorted?.map((alert, index) => {
        if (alertsSorted.length === index + 1) {
          // DataRow in alerts muss implement forwardRef
          return (
            <Alert
              ref={lastListElementRef}
              key={alert.fingerprint}
              alert={alert}
            />
          )
        }
        return <Alert key={alert.fingerprint} alert={alert} />
      })}
      {isAddingItems && (
        <DataGridRow>
          <DataGridCell colSpan={6}>Loading ...</DataGridCell>
        </DataGridRow>
      )}
    </DataGrid>
  )
}

export default AlertsList
