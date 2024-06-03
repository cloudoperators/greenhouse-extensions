/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const listOfCommaSeparatedObjs = (objs) => {
  objs = objs?.edges || []
  return objs
    .filter((obj) => obj?.node?.name)
    .map((obj) => obj?.node?.name)
    .join(", ")
}
