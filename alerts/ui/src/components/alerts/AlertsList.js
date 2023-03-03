import React, {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
} from "react"
import {
  DataGrid,
  DataGridHeadCell,
  DataGridRow,
  DataGridCell,
  Icon,
} from "juno-ui-components"
import { queryAlerts } from "../../queries"
import Alert from "./Alert"
import {
  VariableSizeList as List,
  VariableSizeGrid as Grid,
} from "react-window"

const sortAlerts = (items) => {
  return items.sort((a, b) => {
    if (
      (a.labels?.severity === "critical" &&
        b.labels?.severity !== "critical") ||
      (a.labels?.severity === "warning" &&
        ["critical", "warning"].indexOf(b.labels?.severity) < 0)
    )
      return -1
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state !== b.status?.state &&
      a.status?.state
    )
      return a.status?.state.localeCompare(b.status?.state)
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state === b.status?.state &&
      a.startsAt !== b.startsAt &&
      b.startsAt
    )
      return b.startsAt?.localeCompare(a.startsAt)
    else if (
      a.labels?.severity === b.labels?.severity &&
      a.status?.state === b.status?.state &&
      a.startsAt === b.startsAt &&
      a.labels?.region
    )
      return a.labels?.region?.localeCompare(b.labels?.region)
    else return 1
  })
}

const descriptionParsed = (text) => {
  if (!text) return ""
  // urls in descriptions follow the schema: <URL|URL-NAME>
  // Parse description and replace urls with a-tags
  const regexUrl = /<(http[^>|]+)\|([^>]+)>/g
  const urlParsed = text.replace(regexUrl, `$2`)

  // replace text wrapped in *..* by strong tags
  const regexBold = /\*(.*)\*/g
  const boldParsed = urlParsed.replace(regexBold, `$1`)

  const regexCode = /`(.*)`/g
  return boldParsed.replace(regexCode, `$1`)
}

const AlertsList = () => {
  const { isLoading, isError, data, error } = queryAlerts()
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  console.log("test: ", width, height)

  useLayoutEffect(() => {
    setWidth(ref.current.clientWidth)
    setHeight(ref.current.clientHeight)
  }, [])

  useEffect(() => {
    function handleWindowResize() {
      setWidth(ref.current.clientWidth)
      setHeight(ref.current.clientHeight)
    }

    window.addEventListener("resize", handleWindowResize)

    return () => {
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [])

  // TODO: the sorting should probably not happen here but in the query action
  const alertsSorted = useMemo(() => {
    if (data) {
      return sortAlerts(data)
    }
  }, [data])

  const Row = React.useCallback(
    ({ index, style }) => (
      <div style={{ ...style, width: "100%" }}>
        <DataGridRow>
          <DataGridCell>
            <Icon icon="danger" />
          </DataGridCell>
          <DataGridCell>Region</DataGridCell>
          <DataGridCell>Service</DataGridCell>
          <DataGridCell>Description</DataGridCell>
          <DataGridCell>Firing Since</DataGridCell>
          <DataGridCell>Status</DataGridCell>
          <DataGridCell></DataGridCell>
        </DataGridRow>
      </div>
    ),
    [alertsSorted]
  )

  const Cell = React.useCallback(
    ({ columnIndex, rowIndex, style }) => {
      const alert = alertsSorted[rowIndex]
      const alertData = [
        "",
        alert.labels?.region,
        alert.labels?.service,
        alert.annotations?.summary,
        "Date",
        alert.status?.state,
        "Button",
      ]
      return <div style={style}>{alertData[columnIndex]}</div>
    },
    [alertsSorted]
  )

  const getItemSize = (index) => {
    const alert = alertsSorted[index] || {}
    const desc = `${alert?.annotations?.summary}${descriptionParsed(
      alert.annotations?.description
    )}`

    const a = Math.ceil(`${alert?.annotations?.summary}`.length / 80)
    const b = Math.ceil(`${alert?.annotations?.description}`.length / 80)
    const r = a * 22 + b * 22 + 20
    console.log("DESC: ", a * 25, " - ", b * 20, r, desc)

    // sumary n/70*25
    // desc ->  n/70*20
    // if (desc.length <= 150) {
    //   return 80
    // } else if (desc.length > 150 && desc.length <= 300) {
    //   return 140
    // } else {
    //   return 200
    // }

    return 80
  }

  const ListRow = React.useCallback(
    ({ index, style }) => {
      const alert = alertsSorted[index]
      return (
        <div style={style}>
          <DataGrid gridColumnTemplate="0.25fr 0.75fr 0.75fr 3fr 1.5fr 0.5fr 1fr">
            <Alert alert={alert} />
          </DataGrid>
        </div>
      )
    },
    [alertsSorted]
  )

  const columnWidths = [80, 300, 80, 500, 100, 100, 100]

  return (
    <div ref={ref} className="h-full">
      {/* <DataGrid columns={7} minContentColumns={[0, 2, 5]}>
        {!isLoading && (
          <>
            <DataGridRow>
              <DataGridHeadCell>
                <Icon icon="danger" />
              </DataGridHeadCell>
              <DataGridHeadCell>Region</DataGridHeadCell>
              <DataGridHeadCell>Service</DataGridHeadCell>
              <DataGridHeadCell>Description</DataGridHeadCell>
              <DataGridHeadCell>Firing Since</DataGridHeadCell>
              <DataGridHeadCell>Status</DataGridHeadCell>
              <DataGridHeadCell></DataGridHeadCell>
            </DataGridRow>

            {alertsSorted?.length > 0 && (
              <>
                <Alert alert={alertsSorted[0]} />
                <Alert alert={alertsSorted[1]} />
              </>
            )}
          </>
        )}
      </DataGrid> */}

      {!isLoading && alertsSorted?.length > 0 && (
        <>
          <DataGrid gridColumnTemplate="0.25fr 0.75fr 0.75fr 3fr 1.5fr 0.5fr 1fr">
            <DataGridRow>
              <DataGridHeadCell>
                <Icon icon="danger" />
              </DataGridHeadCell>
              <DataGridHeadCell>Region</DataGridHeadCell>
              <DataGridHeadCell>Service</DataGridHeadCell>
              <DataGridHeadCell>Description</DataGridHeadCell>
              <DataGridHeadCell>Firing Since</DataGridHeadCell>
              <DataGridHeadCell>Status</DataGridHeadCell>
              <DataGridHeadCell></DataGridHeadCell>
            </DataGridRow>
          </DataGrid>
          <List
            height={height - 100}
            itemCount={alertsSorted?.length}
            itemSize={getItemSize}
            width={width}
          >
            {ListRow}
          </List>
        </>
      )}

      {/* <Grid
        columnCount={7}
        columnWidth={(index) => columnWidths[index]}
        height={500}
        rowCount={alertsSorted?.length}
        rowHeight={() => 35}
        width={1300}
      >
        {Cell}
      </Grid> */}
    </div>
  )
}

export default AlertsList
