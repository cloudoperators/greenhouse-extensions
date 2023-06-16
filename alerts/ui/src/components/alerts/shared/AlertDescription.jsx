import React from "react"
import { Markup } from "interweave"

import { descriptionParsed } from "../../../lib/utils"


const AlertDescription = ({description}) => {

  return (
    <Markup
      content={descriptionParsed(
        description?.replace(
          /`([^`]+)`/g,
          "<code class='inline-code'>$1</code>"
        )
      )}
      tagName="div"
      className="text-theme-light"
    />
  )
}

export default AlertDescription