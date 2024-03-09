import useUrlState from "../hooks/useUrlState"
import useCommunication from "../hooks/useCommunication"

const AsyncWorker = ({ consumerId }) => {
  useUrlState(consumerId)
  useCommunication()

  return null
}

export default AsyncWorker
