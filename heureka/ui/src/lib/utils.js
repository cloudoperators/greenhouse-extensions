/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
