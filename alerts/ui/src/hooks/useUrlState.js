/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLayoutEffect, useEffect, useState } from "react"
import { registerConsumer } from "@cloudoperators/juno-url-state-provider-v1"
import {
  useAuthLoggedIn,
  useFilterLabels,
  useFilterActions,
  useActiveFilters,
  usePausedFilters,
  useActivePredefinedFilter,
  useGlobalsActiveSelectedTab,
  useSearchTerm,
  useShowDetailsFor,
  useGlobalsActions,
  useSilencesActions,
  useSilencesRegEx,
  useSilencesStatus,
  useShowDetailsForSilence,
} from "./useAppStore"

const urlStateManager = registerConsumer("supernova")
const ACTIVE_FILTERS = "f"
const PAUSED_FILTERS = "pf"
const ACTIVE_PREDEFINED_FILTER = "p"
const DETAILS_FOR = "d"
const SEARCH_TERM = "s"
const ACTIVE_TAB = "t"
/// silences
const SILENCE_REG_EX = "r"
const SILENCE_STATUS = "st"
const SILENCE_DETAIL = "sd"

const useUrlState = () => {
  const [isURLRead, setIsURLRead] = useState(false)
  const loggedIn = useAuthLoggedIn()
  const {
    setActiveFilters,
    setPausedFilters,
    setActivePredefinedFilter,
    setSearchTerm,
  } = useFilterActions()
  const { setSilencesRegEx, setSilencesStatus, setShowDetailsForSilence } =
    useSilencesActions()
  const filterLabels = useFilterLabels()
  const activeFilters = useActiveFilters()
  const pausedFilters = usePausedFilters()
  const searchTerm = useSearchTerm()
  const activePredefinedFilter = useActivePredefinedFilter()
  const activeSelectedTab = useGlobalsActiveSelectedTab()
  const { setShowDetailsFor, setActiveSelectedTab } = useGlobalsActions()
  const detailsFor = useShowDetailsFor()
  const silenceRegEx = useSilencesRegEx()
  const silenceStatus = useSilencesStatus()
  const silenceDetail = useShowDetailsForSilence()

  // Set initial state from URL (on login)
  // useLayoutEffect so this is done before rendering anything
  useLayoutEffect(() => {
    // do not read the url state until the user is logged in and do it just once
    if (isURLRead) return

    console.debug(
      "SUPERNOVA:: setting up state from url with state::",
      urlStateManager.currentState()
    )

    // get active filters from url state
    const activeFiltersFromURL =
      urlStateManager.currentState()?.[ACTIVE_FILTERS]

    // check if there are active filters in the url state
    if (activeFiltersFromURL && Object.keys(activeFiltersFromURL).length > 0) {
      setActiveFilters(activeFiltersFromURL)
    }

    // get paused filters from url state and set it in store
    const pausedFiltersFromURL =
      urlStateManager.currentState()?.[PAUSED_FILTERS]
    if (pausedFiltersFromURL) {
      setPausedFilters(pausedFiltersFromURL)
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

    //get Tab from url state
    const activeTabFromURL = urlStateManager.currentState()?.[ACTIVE_TAB]
    if (activeTabFromURL) {
      setActiveSelectedTab(activeTabFromURL)
    }

    // get silence regex search from url state
    const silenceRegExFromURL = urlStateManager.currentState()?.[SILENCE_REG_EX]
    if (silenceRegExFromURL) {
      let decoded = atob(silenceRegExFromURL)
      // decode the search term from the url. It is base64 encoded to avoid issues with special characters
      if (decoded) {
        setSilencesRegEx(decoded)
      }
    }

    // get silence status from url state
    const silenceStatusFromURL =
      urlStateManager.currentState()?.[SILENCE_STATUS]
    if (silenceStatusFromURL) {
      setSilencesStatus(silenceStatusFromURL)
    }

    // get silence detail from url state
    const silenceDetailFromURL =
      urlStateManager.currentState()?.[SILENCE_DETAIL]
    if (silenceDetailFromURL) {
      setShowDetailsForSilence(silenceDetailFromURL)
    }

    setIsURLRead(true)
  }, [isURLRead, filterLabels])

  // sync URL with the desired states
  useEffect(() => {
    // do not synchronize the states until the url state is read and user logged in
    if (!isURLRead) return

    // encode searchTerm before pushing it to the URL to avoid missinterpretation of special characters
    const encodedSearchTerm = btoa(searchTerm)
    const encodedSilenceRegEx = btoa(silenceRegEx)

    const newState = {
      ...urlStateManager.currentState(),
      [ACTIVE_FILTERS]: activeFilters,
      [PAUSED_FILTERS]: pausedFilters,
      [SEARCH_TERM]: encodedSearchTerm,
      [ACTIVE_PREDEFINED_FILTER]: activePredefinedFilter,
      [DETAILS_FOR]: detailsFor,
      [ACTIVE_TAB]: activeSelectedTab,
      [SILENCE_REG_EX]: encodedSilenceRegEx,
      [SILENCE_STATUS]: silenceStatus,
      [SILENCE_DETAIL]: silenceDetail,
    }

    // do not push the state if it is the same as the current one
    // otherwise it will reset the browser history and the forward button will not work
    if (
      JSON.stringify(newState) ===
      JSON.stringify(urlStateManager.currentState())
    )
      return

    urlStateManager.push(newState)
  }, [
    loggedIn,
    activeFilters,
    pausedFilters,
    searchTerm,
    activePredefinedFilter,
    detailsFor,
    activeSelectedTab,
    silenceRegEx,
    silenceStatus,
    silenceDetail,
  ])

  // Support for back button
  useEffect(() => {
    const unregisterStateListener = urlStateManager.onChange((state) => {
      setActiveFilters(state?.[ACTIVE_FILTERS])
      setPausedFilters(state?.[PAUSED_FILTERS])
      setSearchTerm(state?.[SEARCH_TERM])
      setActivePredefinedFilter(state?.[ACTIVE_PREDEFINED_FILTER])
      setShowDetailsFor(state?.[DETAILS_FOR])
      setActiveSelectedTab(state?.[ACTIVE_TAB])
      setSilencesRegEx(state?.[SILENCE_REG_EX])
      setSilencesStatus(state?.[SILENCE_STATUS])
      setShowSilenceDetails(state?.[SILENCE_DETAIL])
    })

    return () => {
      unregisterStateListener()
    }
  }, [])
}

export default useUrlState
