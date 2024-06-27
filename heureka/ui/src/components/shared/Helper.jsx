/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const listOfCommaSeparatedObjs = (objs, prop) => {
  objs = objs?.edges || []
  return objs
    .filter((obj) => obj?.node?.[prop])
    .map((obj) => obj?.node?.[prop])
    .join(", ")
}
