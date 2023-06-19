import React, { useMemo } from "react"
import { Stack } from "juno-ui-components"
import { useSilencesItemsHash } from "../../hooks/useStore"

const AlertStatus = ({ status }) => {
  const allSilences = useSilencesItemsHash()

  const silences = useMemo(() => {
    if (!status || !status?.silencedBy) return []
    let silenceIds = status.silencedBy
    if (!Array.isArray(silenceIds)) silenceIds = [silenceIds]
    return silenceIds.map((id) => ({ id, silence: allSilences[id] }))
  }, [status])

  return (
    <>
      {status?.state && <div>{status.state}</div>}
      {status?.inhibitedBy && status?.inhibitedBy?.length > 0 && (
        <div className="text-xs mt-2">
          <Stack direction="vertical">
            <span>Inhibited by:</span>
            <span>{status.inhibitedBy}</span>
          </Stack>
        </div>
      )}
      {silences && silences.length > 0 && (
        <div className="text-xs mt-2">
          <Stack direction="vertical">
            <span>Silenced by:</span>
            {silences.map((data) => (
              <span key={data.id}>
                {data.silence ? data.silence?.createdBy : data.id}
              </span>
            ))}
          </Stack>
        </div>
      )}
    </>
  )
}

export default AlertStatus
