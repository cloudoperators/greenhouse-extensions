import React from "react"
import useCommunication from "../hooks/useCommunication"
import useAlertmanagerAPI from "../hooks/useAlertmanagerAPI"
import useInitialFilters from "../hooks/useInitialFilters"
import useUrlState from "../hooks/useUrlState"

const AsyncWorker = ({ endpoint }) => {
  useCommunication()
  useAlertmanagerAPI(endpoint)
  useUrlState()
  useInitialFilters()
  return null
}

export default AsyncWorker
