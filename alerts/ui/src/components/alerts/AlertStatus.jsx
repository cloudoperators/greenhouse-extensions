import React, { useMemo } from "react"
import { Stack } from "juno-ui-components"
import {
  useSilencesItemsHash,
  useSilencesLocalItems,
  useSilencesActions,
} from "../../hooks/useStore"

const AlertStatus = ({ alert }) => {
  const allSilences = useSilencesItemsHash()
  const localSilences = useSilencesLocalItems()
  const { getMappingSilences } = useSilencesActions()

  const silences = useMemo(() => {
    if (!alert) return []
    return getMappingSilences(alert)
  }, [alert, allSilences, localSilences])

  const state = useMemo(() => {
    // find a localSilence with alertFingerprint equals to the alert fingerprint
    const localSilence = Object.values(localSilences).find(
      (silence) => silence?.alertFingerprint === alert?.fingerprint
    )
    // if silence found in local store, return suppressed
    if (localSilence)
      return (
        <Stack direction="vertical">
          <span>suppressed</span>
          <span className="text-xs text-theme-warning">(processing)</span>
        </Stack>
      )
    return <span>{alert?.status?.state}</span>
  }, [alert?.status.state, localSilences])

  return (
    <>
      {state && <>{state}</>}
      {alert?.status?.inhibitedBy?.length > 0 && (
        <div className="text-xs mt-2">
          <Stack direction="vertical">
            <span>Inhibited by:</span>
            <span>{alert?.status?.inhibitedBy}</span>
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
