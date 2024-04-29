/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { Stack, Button, Select, SelectOption } from "juno-ui-components"

const paginationStyles = `
  jn-flex
  jn-gap-[0.375rem]
  jn-items-center
`

const PaginationV2 = ({
  currentPage,
  totalPages,
  isLoading,
  disabled,
  onPaginationChanged,
}) => {
  const handlePrevClick = () => {
    if (onPaginationChanged) {
      onPaginationChanged(currentPage - 1)
    }
  }

  const handleNextClick = () => {
    if (onPaginationChanged) {
      onPaginationChanged(currentPage + 1)
    }
  }

  const handleSelectChange = (newPage) => {
    if (onPaginationChanged) {
      onPaginationChanged(parseInt(newPage))
    }
  }

  return (
    <Stack alignment="center" className="mt-4" distribution="end">
      {isLoading ? <span className="mr-2"> Loading...</span> : null}
      <div className={`juno-pagination juno-pagination-${paginationStyles}`}>
        <Button
          icon="chevronLeft"
          disabled={currentPage == 1 || disabled}
          onClick={handlePrevClick}
          title="Previous Page"
        />
        <Select
          name="pages"
          width="auto"
          value={currentPage?.toString() || "1"}
          disabled={disabled}
          onChange={handleSelectChange}
        >
          {[...Array(totalPages || 0).keys()].map((index) => {
            const pageNumber = index + 1
            return (
              <SelectOption
                value={pageNumber.toString()}
                label={pageNumber.toString()}
                key={pageNumber}
              />
            )
          })}
        </Select>
        <Button
          icon="chevronRight"
          disabled={currentPage == totalPages || disabled}
          onClick={handleNextClick}
          title="Next Page"
        />
      </div>
    </Stack>
  )
}

export default PaginationV2
