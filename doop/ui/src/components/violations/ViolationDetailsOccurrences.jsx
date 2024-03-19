/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Interweave } from "interweave"
import Collapsible from "../shared/Collapsible"

const VARIABLE_REGEX = /\u003c([^\u003e]+)\u003e/g
const COLLAPSE_REGIONS_COUNT = 3

const parseVariables = (text) => {
  return (
    <Interweave
      content={text.replaceAll(
        VARIABLE_REGEX,
        "<span class='bg-theme-accent/5 border rounded border-theme-accent/25 px-1 py-0.5'>$1</span>"
      )}
    />
  )
}

const ViolationDetailsOccurrences = ({ violation }) => {
  const [showRegions, setShowRegions] = React.useState(false)

  return (
    <>
      <div>
        {violation.kind} <strong>{parseVariables(violation.name)}</strong> in
        namespace {violation.namespace}: {parseVariables(violation.message)}
      </div>
      {violation?.instances?.length > COLLAPSE_REGIONS_COUNT ? (
        <Collapsible show={showRegions} maxHeight={false}>
          <div className="grid grid-cols-[repeat(auto-fill,_minmax(240px,_1fr))] gap-2">
            {violation.instances.map((instance, i) => (
              <div key={i} className="text-sm text-theme-light">
                {instance.cluster}:{instance.name}
              </div>
            ))}
          </div>
        </Collapsible>
      ) : (
        <div className="flex flex-wrap gap-2">
          {violation.instances.map((instance, i) => (
            <div key={i} className="text-sm text-theme-light">
              {instance.cluster}:{instance.name}
            </div>
          ))}
        </div>
      )}
      {violation?.instances?.length > COLLAPSE_REGIONS_COUNT && (
        <a
          variant="primary"
          onClick={(e) => {
            e.preventDefault()
            setShowRegions(!showRegions)
          }}
          href="#"
        >
          {showRegions
            ? "Hide occurrences"
            : `Show occurrences (${violation.instances?.length})`}
        </a>
      )}
    </>
  )
}

export default ViolationDetailsOccurrences
