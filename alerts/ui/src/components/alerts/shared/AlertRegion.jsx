/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

const AlertRegion = ({ region, cluster }) => {
  return (
    <>
      {region}
      {region !== cluster && (
        <>
          <br />
          <span className="text-theme-light">{cluster}</span>
        </>
      )}
    </>
  )
}

export default AlertRegion
