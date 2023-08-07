import { useLayoutEffect, useEffect } from "react"
import { registerConsumer } from "url-state-provider"
import {
  useAuthLoggedIn,
  useFilterActions,
  useActiveFilters,
  useActivePredefinedFilter,
  useSearchTerm,
  useShowDetailsFor,
  useGlobalsActions,
} from "./useAppStore"

const urlStateManager = registerConsumer("supernova")
const ACTIVE_FILTERS = "f"
const ACTIVE_PREDEFINED_FILTER = "p"
const DETAILS_FOR = "d"
const SEARCH_TERM = "s"

const useUrlState = () => {
  const loggedIn = useAuthLoggedIn()
  const { setActiveFilters, setActivePredefinedFilter, setSearchTerm } =
    useFilterActions()
  const activeFilters = useActiveFilters()
  const searchTerm = useSearchTerm()
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
    const activeFiltersFromURL =
      urlStateManager.currentState()?.[ACTIVE_FILTERS]
    if (activeFiltersFromURL) {
      setActiveFilters(activeFiltersFromURL)
    }

    const searchTermFromURL = urlStateManager.currentState()?.[SEARCH_TERM]
    if (searchTermFromURL) {
      setSearchTerm(searchTermFromURL)
    }

    // get active predefined filters from url state
    const activePredefinedFilterFromURL =
      urlStateManager.currentState()?.[ACTIVE_PREDEFINED_FILTER]
    if (activePredefinedFilterFromURL) {
      setActivePredefinedFilter(activePredefinedFilterFromURL)
    }

    // get detail view target from url state
    const detailsForFromURL = urlStateManager.currentState()?.[DETAILS_FOR]
    if (detailsForFromURL) {
      setShowDetailsFor(detailsForFromURL)
    }
    setIsUrlStateSetup(true)
  }, [loggedIn, setActiveFilters, setActivePredefinedFilter, setSearchTerm])

  // sync URL state for filters
  useEffect(() => {
    if (!loggedIn) return
    // activeFilters: {cluster:["test1", "test2"], region: ["test1"]}
    urlStateManager.push({
      ...urlStateManager.currentState(),
      [ACTIVE_FILTERS]: activeFilters,
    })
  }, [loggedIn, activeFilters])

  // sync URL state for search term
  useEffect(() => {
    if (!loggedIn) return
    urlStateManager.push({
      ...urlStateManager.currentState(),
      [SEARCH_TERM]: searchTerm,
    })
  }, [loggedIn, searchTerm])

  // sync URL state for predefined filters
  useEffect(() => {
    if (!loggedIn) return
    urlStateManager.push({
      ...urlStateManager.currentState(),
      [ACTIVE_PREDEFINED_FILTER]: activePredefinedFilter,
    })
  }, [loggedIn, activePredefinedFilter])

  // sync URL state for details
  useEffect(() => {
    if (!loggedIn) return
    urlStateManager.push({
      ...urlStateManager.currentState(),
      [DETAILS_FOR]: detailsFor,
    })
  }, [loggedIn, detailsFor])
}

export default useUrlState
