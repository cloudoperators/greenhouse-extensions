/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const severityToSemanticName = (severity) => {
  switch (severity) {
    case "critical":
      return "danger"
    case "warning":
      return "warning"
    case "info":
      return "info"
    default:
      return severity
  }
}

export const descriptionParsed = (text) => {
  if (!text) return ""
  // urls in descriptions follow the schema: <URL|URL-NAME>
  // Parse description and replace urls with a-tags
  const regexUrl = /<(http[^>|]+)\|([^>]+)>/g
  const urlParsed = text.replace(regexUrl, `<a href="$1" target="_blank" style="text-decoration: underline;">$2</a>`)

  // replace text wrapped in *..* by strong tags
  const regexBold = /\*(.*)\*/g
  const boldParsed = urlParsed.replace(regexBold, `<strong>$1</strong>`)

  const regexCode = /`(.*)`/g
  return boldParsed.replace(regexCode, `<code class="inline-code">$1</code>`)
}

// Capitalize first char, underscores to spaces, camel case to spaces, all words except the first to lower case
export const humanizeString = (value) => {
  if (!value) {
    return value
  }

  const camelCaseMatch = /([A-Z])/g
  const underscoreMatch = /_/g

  const camelCaseToSpaces = value.replace(camelCaseMatch, " $1")
  const underscoresToSpaces = camelCaseToSpaces.replace(underscoreMatch, " ")

  // all together now (also capitalize first word and lowercase all other words)
  const humanized =
    underscoresToSpaces.charAt(0).toUpperCase() +
    underscoresToSpaces.slice(1).toLowerCase()

  return humanized
}

// sort silences by state
// {
//   active: [...], pending: [...], expired:[...], ...
// }
export const sortSilencesByState = (silences) => {
  const sortedSilences = {}
  
  if (!silences || silences.length === 0) return {}

  silences.forEach((silences) => {
    const state = silences.status?.state
    if (!sortedSilences[state]) sortedSilences[state] = [] // init
    sortedSilences[state].push(silences)
  })
  return sortedSilences
}

// count alerts and create a map
// {
//   global: { total: number, critical: number, ...},
//   regions: {
//     "eu-de-1": { total: number, critical: {total: number, suppressed: number}, warning: {...}, ...}
//   }, ...
// }
export const countAlerts = (alerts) => {
  const counts = { global: { total: 0 }, regions: {} }

  if (!alerts || alerts.length === 0) return counts

  // run through each alert once and adjust different types of counts as necessary
  alerts.forEach((alert) => {
    // total number of alerts
    counts.global.total += 1

    const region = alert.labels?.region
    const severity = alert.labels?.severity
    const state = alert.status?.state

    // global count per severity
    counts.global[severity] = counts.global[severity] || 0 // init
    counts.global[severity] += 1

    // count per region and severity
    counts.regions[region] = counts.regions[region] || {} // init
    counts.regions[region].total = counts.regions[region].total || 0 // init
    counts.regions[region].total += 1

    // total count per region and severity
    counts.regions[region][severity] = counts.regions[region][severity] || {} // init
    counts.regions[region][severity]["total"] =
      counts.regions[region][severity]?.total || 0 // init
    counts.regions[region][severity]["total"] += 1
    // suppressed per region and severity
    if (state === "suppressed") {
      counts.regions[region][severity].suppressed =
        counts.regions[region][severity]?.suppressed || 0 // init
      counts.regions[region][severity].suppressed += 1
    }
  })

  return counts
}

/**
 * This method sorts the alerts first by severity (critical -> warning -> others), then by status, then by startsAt timestamp and finally by region
 * @param {array} items, a list of alerts
 * @returns {array} sorted alerts
 */
export const sortAlerts = (items) => {
  const importantSeverities = ["critical", "warning"]

  return items.sort((a, b) => {
    if (
      (a.labels?.severity === "critical" &&
        b.labels?.severity !== "critical") ||
      (a.labels?.severity === "warning" &&
        importantSeverities.indexOf(b.labels?.severity) < 0)
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
