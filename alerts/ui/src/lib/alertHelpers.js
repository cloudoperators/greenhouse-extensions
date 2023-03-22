/** Counts total items and total severities */
export const countTotalSeverities = (items) => {
  if (!Array.isArray(items)) return {}

  let total = items.length
  let critical = items.reduce(
    (acc, current) => (current.labels?.severity === "critical" ? ++acc : acc),
    0
  )
  let warning = items.reduce(
    (acc, current) => (current.labels?.severity === "warning" ? ++acc : acc),
    0
  )
  let info = items.reduce(
    (acc, current) => (current.labels?.severity === "info" ? ++acc : acc),
    0
  )

  return { total, critical, warning, info }
}

/** Counts severities per region */
export const countSeveritiesPerRegion = (items) => {
  if (!Array.isArray(items)) return {}

  let severityCountsPerRegion = {}
  // find all regions (deduplicate by using Map), sort by region name
  const regions = [
    ...new Map(
      items.map((item) => [item.labels?.region, item.labels?.region]).sort()
    ).keys(),
  ]

  regions.forEach((region) => {
    let critical = items.reduce(
      (acc, current) =>
        current.labels?.region === region &&
        current.labels?.severity === "critical"
          ? ++acc
          : acc,
      0
    )
    let warning = items.reduce(
      (acc, current) =>
        current.labels?.region === region &&
        current.labels?.severity === "warning"
          ? ++acc
          : acc,
      0
    )
    let info = items.reduce(
      (acc, current) =>
        current.labels?.region === region && current.labels?.severity === "info"
          ? ++acc
          : acc,
      0
    )

    severityCountsPerRegion[region] = { critical, warning, info }
  })

  return severityCountsPerRegion
}
