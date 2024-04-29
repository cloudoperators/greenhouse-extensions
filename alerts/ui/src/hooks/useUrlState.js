/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLayoutEffect, useEffect, useState } from "react"
import { registerConsumer } from "url-state-provider"
import {
  useAuthLoggedIn,
  useAuthData,
  useFilterLabels,
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
  const [isURLRead, setIsURLRead] = useState(false)
  const loggedIn = useAuthLoggedIn()
  const authData = useAuthData()
  const { setActiveFilters, setActivePredefinedFilter, setSearchTerm } =
    useFilterActions()
  const filterLabels = useFilterLabels()
  const activeFilters = useActiveFilters()
  const searchTerm = useSearchTerm()
  const activePredefinedFilter = useActivePredefinedFilter()
  const { setShowDetailsFor } = useGlobalsActions()
  const detailsFor = useShowDetailsFor()

  // Set initial state from URL (on login)
  // useLayoutEffect so this is done before rendering anything
  useLayoutEffect(() => {
    // do not read the url state until the user is logged in and do it just once
    if (!loggedIn || isURLRead) return

    console.log(
      "SUPERNOVA:: setting up state from url with state::",
      urlStateManager.currentState()
    )

    // get active filters from url state
    const activeFiltersFromURL =
      urlStateManager.currentState()?.[ACTIVE_FILTERS]

    // check if there are active filters in the url state
    if (activeFiltersFromURL && Object.keys(activeFiltersFromURL).length > 0) {
      setActiveFilters(activeFiltersFromURL)
    } else {
      // otherwise set the support group filter
      // we just add this default filter when no other filters are set via URL
      const label = "support_group"
      if (
        authData?.parsed?.supportGroups?.length > 0 &&
        filterLabels?.length > 0 &&
        filterLabels.includes(label)
      ) {
        // this will also trigger a filterItems() call from the store self
        setActiveFilters({ [label]: authData.parsed.supportGroups })
      }
    }

    const searchTermFromURL = urlStateManager.currentState()?.[SEARCH_TERM]
    if (searchTermFromURL) {
      // decode the search term from the url. It is base64 encoded to avoid issues with special characters
      setSearchTerm(atob(searchTermFromURL))
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
    setIsURLRead(true)
  }, [loggedIn, isURLRead, authData, filterLabels])

  // sync URL with the desired states
  useEffect(() => {
    // do not synchronize the states until the url state is read and user logged in
    if (!loggedIn || !isURLRead) return

    // encode searchTerm before pushing it to the URL to avoid missinterpretation of special characters
    const encodedSearchTerm = btoa(searchTerm)

    const newState = {
      ...urlStateManager.currentState(),
      [ACTIVE_FILTERS]: activeFilters,
      [SEARCH_TERM]: encodedSearchTerm,
      [ACTIVE_PREDEFINED_FILTER]: activePredefinedFilter,
      [DETAILS_FOR]: detailsFor,
    }

    // do not push the state if it is the same as the current one
    // otherwise it will reset the browser history and the forward button will not work
    if (
      JSON.stringify(newState) ===
      JSON.stringify(urlStateManager.currentState())
    )
      return

    urlStateManager.push(newState)
  }, [loggedIn, activeFilters, searchTerm, activePredefinedFilter, detailsFor])

  // Support for back button
  useEffect(() => {
    const unregisterStateListener = urlStateManager.onChange((state) => {
      setActiveFilters(state?.[ACTIVE_FILTERS])
      setSearchTerm(state?.[SEARCH_TERM])
      setActivePredefinedFilter(state?.[ACTIVE_PREDEFINED_FILTER])
      setShowDetailsFor(state?.[DETAILS_FOR])
    })

    return () => {
      unregisterStateListener()
    }
  }, [])
}

export default useUrlState
