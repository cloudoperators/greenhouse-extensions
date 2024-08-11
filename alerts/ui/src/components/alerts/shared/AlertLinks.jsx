/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Stack } from "@cloudoperators/juno-ui-components"

const AlertLinks = ({ alert, className }) => {
  return (
    <Stack gap="3" className={className}>
      {alert?.generatorURL && (
        <a
          className="underline"
          href={alert?.generatorURL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Prometheus
        </a>
      )}
      {alert?.labels?.playbook && (
        <a
          className="underline"
          href={`https://operations.global.cloud.sap/${alert?.labels?.playbook}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Playbook
        </a>
      )}
      {alert?.labels?.kibana && (
        <a
          className="underline"
          href={`https://logs.${alert?.labels?.region}.cloud.sap/${alert?.labels?.kibana}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Logs
        </a>
      )}
      {alert?.labels?.dashboard && (
        <a
          className="underline"
          href={`https://plutono.${alert?.labels?.region}.cloud.sap/d/${alert?.labels?.dashboard}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Plutono
        </a>
      )}
      {alert?.labels?.spc && (
        <a
          className="underline"
          href={`https://spc.ondemand.com/ticket_create/?${alert?.labels?.spc}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          SPC Ticket
        </a>
      )}
      {alert?.labels?.sentry && (
        <a
          className="underline"
          href={`https://sentry.${alert?.labels?.region}.cloud.sap/monsoon/${alert?.labels?.sentry}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Sentry
        </a>
      )}
      {alert?.labels?.cloudops && (
        <a
          className="underline"
          href={`https://dashboard.${alert?.labels?.region}.cloud.sap/ccadmin/cloud_admin/cloudops#/universal-search/${alert?.labels?.cloudops}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          CloudOps
        </a>
      )}
      {alert?.labels?.report && (
        <a
          className="underline"
          href={`https://dashboard.${alert?.labels?.region}.cloud.sap/${alert?.labels?.report}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Report
        </a>
      )}
      {alert?.annotations?.mail_subject && (
        <a
          className="underline"
          href={`mailto:?subject=${encodeURIComponent(
            alert?.annotations?.mail_subject
          )}&body=${encodeURIComponent(alert?.annotations?.mail_body)}`}
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Email Owner
        </a>
      )}
    </Stack>
  )
}

export default AlertLinks
