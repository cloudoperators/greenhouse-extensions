import { useEffect, useState } from "react"

import {
  useAuthData,
  useFilterLabels,
  useFilterActions,
  useActiveFilters,
  useAlertsActions,
  useGlobalsIsUrlStateSetup,
} from "./useAppStore"

const useInitialFilters = () => {
  const authData = useAuthData()
  const filterLabels = useFilterLabels()
  const { addActiveFilters } = useFilterActions()
  const activeFilters = useActiveFilters()
  const { filterItems } = useAlertsActions()
  const isUrlStateSetup = useGlobalsIsUrlStateSetup()

  const [isRunOnce, setIsRunOnce] = useState(false)

  // load predefined filters
  useEffect(() => {
    // wait until state from Url is set
    if (!isUrlStateSetup) return

    // let this run once
    if (isRunOnce) return
    setIsRunOnce(true)

    // if filters already set through url state provider do nothing
    if (activeFilters && Object.keys(activeFilters).length > 0) return

    // add support group filter if user is in a support group
    const label = "support_group"
    if (
      // negate the following conditions
      authData?.parsed?.teams &&
      authData?.parsed?.teams?.length > 0 &&
      filterLabels?.length > 0 &&
      filterLabels.includes(label)
    ) {
      // this will also trigger a filterItems() call
      addActiveFilters(label, authData.parsed.teams)
    } else {
      // otherwise filter once to ensure any default filters are applied
      filterItems()
    }
  }, [
    isUrlStateSetup,
    isRunOnce,
    filterLabels,
    authData,
    addActiveFilters,
    activeFilters,
  ])
}

export default useInitialFilters
