import { useLayoutEffect, useEffect } from "react"
import { registerConsumer } from "url-state-provider"
import {
  useAuthLoggedIn,
  useFilterLabels,
  useFilterActions,
  useActiveFilters,
  useShowDetailsFor,
  useGlobalsActions,
} from "./useStore"

const urlStateManager = registerConsumer("supernova")
const ACTIVE_FILTERS = "f"
const DETAILS_FOR = "d"

const useUrlState = () => {
  const loggedIn = useAuthLoggedIn()
  const { setActiveFilters } = useFilterActions()
  const activeFilters = useActiveFilters()
  const { setIsUrlStateSetup, setShowDetailsFor } = useGlobalsActions()
  const detailsFor = useShowDetailsFor()

  // Set initial state from URL (on login)
  // do with useLayoutEffect so the ui isn't rendered before
  useLayoutEffect(() => {
    if (!loggedIn) return

    console.log(
      "SUPERNOVA:: setting up state from url::",
      urlStateManager.currentState()
    )

    const activeFilters = urlStateManager.currentState()?.[ACTIVE_FILTERS]
    if (activeFilters) {
      setActiveFilters(activeFilters)
    }
    const detailsFor = urlStateManager.currentState()?.[DETAILS_FOR]
    if (detailsFor) {
      setShowDetailsFor(detailsFor)
    }
    setIsUrlStateSetup(true)
  }, [loggedIn, setActiveFilters])

  // sync URL state for filters
  useEffect(() => {
    if (!loggedIn) return
    // activeFilters: {cluster:["test1", "test2"], region: ["test1"]}
    urlStateManager.push({ [ACTIVE_FILTERS]: activeFilters })
  }, [loggedIn, activeFilters])

  // sync URL state for details
  useEffect(() => {
    if (!loggedIn) return
    urlStateManager.push({ [DETAILS_FOR]: detailsFor })
  }, [loggedIn, detailsFor])
}

export default useUrlState
