import { useLayoutEffect, useEffect } from "react"
import { registerConsumer } from "url-state-provider"
import {
  useAuthLoggedIn,
  useFilterActions,
  useActiveFilters,
  useActivePredefinedFilter,
  useShowDetailsFor,
  useGlobalsActions,
} from "./useAppStore"

const urlStateManager = registerConsumer("supernova")
const ACTIVE_FILTERS = "f"
const ACTIVE_PREDEFINED_FILTER = "p"
const DETAILS_FOR = "d"

const useUrlState = () => {
  const loggedIn = useAuthLoggedIn()
  const { setActiveFilters, setActivePredefinedFilter } = useFilterActions()
  const activeFilters = useActiveFilters()
  const activePredefinedFilter = useActivePredefinedFilter()
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
    const activePredefinedFilter =
      urlStateManager.currentState()?.[ACTIVE_PREDEFINED_FILTER]
    if (activePredefinedFilter) {
      setActivePredefinedFilter(activePredefinedFilter)
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
    urlStateManager.push({
      ...urlStateManager.currentState(),
      [ACTIVE_FILTERS]: activeFilters,
    })
    // urlStateManager.push({[ACTIVE_FILTERS]: activeFilters }, {merge: true}) // why this no worky?
    // console.log("===== urlstate filter: ", urlStateManager.currentState())
  }, [loggedIn, activeFilters])

  // sync URL state for predefined filters
  useEffect(() => {
    if (!loggedIn) return
    urlStateManager.push({
      ...urlStateManager.currentState(),
      [ACTIVE_PREDEFINED_FILTER]: activePredefinedFilter,
    })
    // urlStateManager.push({[ACTIVE_PREDEFINED_FILTER]: activePredefinedFilter }, {merge: true})
    // console.log("===== urlstate predef: ", urlStateManager.currentState())
  }, [loggedIn, activePredefinedFilter])

  // sync URL state for details
  useEffect(() => {
    if (!loggedIn) return
    urlStateManager.push({
      ...urlStateManager.currentState(),
      [DETAILS_FOR]: detailsFor,
    })
    // urlStateManager.push({[DETAILS_FOR]: detailsFor }, {merge: true})
    // console.log("===== urlstate details: ", urlStateManager.currentState())
  }, [loggedIn, detailsFor])
}

export default useUrlState
