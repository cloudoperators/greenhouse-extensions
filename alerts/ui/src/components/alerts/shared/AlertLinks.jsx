import React from "react"

import { useGlobalsActions } from "../../../hooks/useAppStore"
import { Stack } from "juno-ui-components"

const AlertLinks = ({ alert, className }) => {
  const { setShowDetailsFor } = useGlobalsActions()

  const handleShowDetails = (e) => {
    e.preventDefault()
    setShowDetailsFor(alert?.fingerprint)
  }

  return (
    <Stack gap="3" className={className}>
      {alert?.generatorURL && (
        <a
          className="underline"
          href={alert?.generatorURL}
          target="_blank"
          rel="noopener noreferrer"
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
        >
          Logs
        </a>
      )}
      {alert?.labels?.dashboard && (
        <a
          className="underline"
          href={`https://grafana.${alert?.labels?.region}.cloud.sap/d/${alert?.labels?.dashboard}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Grafana
        </a>
      )}
      {alert?.labels?.spc && (
        <a
          className="underline"
          href={`https://spc.ondemand.com/ticket_create/?${alert?.labels?.spc}`}
          target="_blank"
          rel="noopener noreferrer"
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
        >
          Email Owner
        </a>
      )}
      <a
        className="underline"
        href="#"
        rel="noopener noreferrer"
        onClick={handleShowDetails}
      >
        Details
      </a>
    </Stack>
  )
}

export default AlertLinks
