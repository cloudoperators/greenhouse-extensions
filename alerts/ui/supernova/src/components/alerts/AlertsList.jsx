/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef, useCallback } from "react"
import {
  DataGrid,
  DataGridHeadCell,
  DataGridRow,
  DataGridCell,
  Icon,
  Stack,
} from "juno-ui-components"
import Alert from "./Alert"
import {
  useAlertsItemsFiltered,
  useAlertsIsLoading,
} from "../../hooks/useAppStore"

const AlertsList = () => {
  const [visibleAmount, setVisibleAmount] = useState(20)
  const [isAddingItems, setIsAddingItems] = useState(false)
  const timeoutRef = React.useRef(null)

  const itemsFiltered = useAlertsItemsFiltered()
  const alertsIsLoading = useAlertsIsLoading()

  const alertsSorted = useMemo(() => {
    if (itemsFiltered) {
      return itemsFiltered.slice(0, visibleAmount)
    }
  }, [itemsFiltered, visibleAmount])

  React.useEffect(() => {
    return () => clearTimeout(timeoutRef.current) // clear when component is unmounted
  }, [])

  // endless scroll observer
  const observer = useRef()
  const lastListElementRef = useCallback(
    (node) => {
      // no fetch if loading original data
      if (alertsIsLoading || isAddingItems) return
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
    [alertsIsLoading, isAddingItems]
  )

  return (
    <DataGrid
      columns={7}
      minContentColumns={[0, 2, 5]}
      cellVerticalAlignment="top"
      className="alerts"
    >
      {!alertsIsLoading && (
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
      {alertsSorted?.length > 0 ? (
        alertsSorted?.map((alert, index) => {
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
        })
      ) : (
        <DataGridRow className="no-hover">
          <DataGridCell colSpan={7}>
            <Stack gap="3">
              <Icon icon="info" color="text-theme-info" />
              <div>
                We couldn't find anything. It's possible that the matching
                alerts are not active at the moment, or the chosen filters could
                be overly limiting.
              </div>
            </Stack>
          </DataGridCell>
        </DataGridRow>
      )}
      {isAddingItems && (
        <DataGridRow className="no-hover">
          <DataGridCell colSpan={7}>Loading ...</DataGridCell>
        </DataGridRow>
      )}
    </DataGrid>
  )
}

export default AlertsList
