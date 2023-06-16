import React from "react"


const AlertRegion = ({ region, cluster }) => {

  return (
    <>
      {region}
      {region !== cluster && (
        <>
          <br />
          <span className="text-theme-light">{cluster}</span>
        </>
      )}
    </>
  )
}

export default AlertRegion