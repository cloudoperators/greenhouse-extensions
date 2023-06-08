import { useEffect, useState } from "react"

import {
  useAuthData,
  useFilterLabels,
  useFilterActions,
  useActiveFilters,
  useGlobalsIsUrlStateSetup,
} from "./useStore"

const usePredefinedFilters = () => {
  const authData = useAuthData()
  const filterLabels = useFilterLabels()
  const { addActiveFilter } = useFilterActions()
  const activeFilters = useActiveFilters()
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

    // if no support_group of labels available return
    const label = "support_group"
    if (
      !authData?.parsed?.teams ||
      authData?.parsed?.teams?.length <= 0 ||
      filterLabels?.length <= 0 ||
      !filterLabels.includes(label)
    )
      return

    authData.parsed.teams.forEach((team) => {
      addActiveFilter(label, team)
    })
  }, [
    isUrlStateSetup,
    isRunOnce,
    filterLabels,
    authData,
    addActiveFilter,
    ,
    activeFilters,
  ])
}

export default usePredefinedFilters
