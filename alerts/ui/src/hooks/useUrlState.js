import { useLayoutEffect, useEffect } from "react"
import { registerConsumer } from "url-state-provider"
import {
  useAuthLoggedIn,
  usePredefinedFilters,
  useFilterActions,
  useActiveFilters,
  useShowDetailsFor,
  useGlobalsActions,
} from "./useStore"

const urlStateManager = registerConsumer("supernova")
const ACTIVE_FILTERS = "f"
const ACTIVE_PREDEFINED_FILTERS = "p"
const DETAILS_FOR = "d"

const useUrlState = () => {
  const loggedIn = useAuthLoggedIn()
  const { setActiveFilters, setPredefinedFiltersActivationState } = useFilterActions()
  const activeFilters = useActiveFilters()
  const predefinedFilters = usePredefinedFilters()
  const { setIsUrlStateSetup, setShowDetailsFor } = useGlobalsActions()
  const detailsFor = useShowDetailsFor()

  // Set initial state from URL (on login)
  // useLayoutEffect so this is done before rendering anything
  useLayoutEffect(() => {
    if (!loggedIn) return

    console.log(
      "SUPERNOVA:: setting up state from url::",
      urlStateManager.currentState()
    )
    
    // get active filters from url state
    const activeFilters = urlStateManager.currentState()?.[ACTIVE_FILTERS]
    if (activeFilters) {
      setActiveFilters(activeFilters)
    }

    // get active predefined filters from url state
    const activePredefinedFilters = urlStateManager.currentState()?.[ACTIVE_PREDEFINED_FILTERS]
    if (activePredefinedFilters) {
      setPredefinedFiltersActivationState(activePredefinedFilters)
    }

    // get detail view target from url state
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
    urlStateManager.push({...urlStateManager.currentState(), [ACTIVE_FILTERS]: activeFilters })
  }, [loggedIn, activeFilters])

  // sync URL state for predefined filters
  useEffect(() => {
    if (!loggedIn) return

    //filter predefined filters to only active ones and return an array of their names
    const activePredefinedFilters = predefinedFilters.filter(
      (filter) => filter.active
    ).map((filter) => filter.name)
    urlStateManager.push({...urlStateManager.currentState(), [ACTIVE_PREDEFINED_FILTERS]: activePredefinedFilters })
  }, [loggedIn, predefinedFilters])

  // sync URL state for details
  useEffect(() => {
    if (!loggedIn) return
    urlStateManager.push({...urlStateManager.currentState(), [DETAILS_FOR]: detailsFor })
  }, [loggedIn, detailsFor])
}

export default useUrlState
