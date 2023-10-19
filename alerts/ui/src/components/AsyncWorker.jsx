import React from "react"
import useCommunication from "../hooks/useCommunication"
import useAlertmanagerAPI from "../hooks/useAlertmanagerAPI"
import useUrlState from "../hooks/useUrlState"

const AsyncWorker = ({ endpoint }) => {
  useCommunication()
  useAlertmanagerAPI(endpoint)
  useUrlState()
  return null
}

export default AsyncWorker
