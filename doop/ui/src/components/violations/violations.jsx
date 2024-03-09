import React from "react"
import { useDataLoaded } from "../StoreProvider"
import ViolationsList from "./ViolationsList"
import Filters from "../filters/Filters"
import ViolationDetails from "./ViolationDetails"

const Violations = () => {
  const loaded = useDataLoaded()

  return (
    <>
      {loaded ? (
        <>
          <Filters />
          <ViolationsList />
          <ViolationDetails />
        </>
      ) : (
        <span>Could not load data</span>
      )}
    </>
  )
}

export default Violations
