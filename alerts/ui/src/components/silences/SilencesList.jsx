/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  DataGrid,
  DataGridHeadCell,
  DataGridRow,
  DataGridCell,
  SearchInput,
  Stack,
  Select,
  SelectOption,
  Spinner,
  Icon,
} from "juno-ui-components"
import constants from "../../constants"

import {
  useSilencesItems,
  useSilencesActions,
  useSilencesRegEx,
  useSilencesStatus,
  useSilencesIsLoading,
} from "../../hooks/useAppStore"
import SilencesItem from "./SilencesItem"
import { useEndlessScrollList } from "utils"

const filtersStyles = `
bg-theme-background-lvl-1
py-2
px-4
my-px
`

const SilencesList = () => {
  const silences = useSilencesItems()
  const [visibleSilences, setVisibleSilences] = useState(silences)
  const { setSilencesStatus, setSilencesRegEx } = useSilencesActions()
  const status = useSilencesStatus()
  const regEx = useSilencesRegEx()
  const isSilencesLoading = useSilencesIsLoading()

  //  useEffect which loggs when isLoading changes

  useEffect(() => {
    console.log("isLoading changed to: ", isSilencesLoading)
  }, [isSilencesLoading])

  useEffect(() => {
    let filtered = silences.filter(
      (silence) => silence?.status?.state === status
    )

    try {
      if (regEx) {
        filtered = filtered.filter((silence) =>
          JSON.stringify(silence).match(new RegExp(regEx, "i"))
        )
      }
    } catch (e) {
      console.warn("search term is not a valid regex. " + e)

      filtered = filtered.filter((silence) =>
        JSON.stringify(silence).toLowerCase().includes(regEx.toLowerCase)
      )
    }

    setVisibleSilences(filtered)
  }, [status, regEx, silences])

  const handleSearchChange = (value) => {
    // debounce setSearchTerm to avoid unnecessary re-renders
    const debouncedSearchTerm = setTimeout(() => {
      setSilencesRegEx(value.target.value)
    }, 500)

    // clear timeout if we have a new value
    return () => clearTimeout(debouncedSearchTerm)
  }
  const { scrollListItems, iterator } = useEndlessScrollList(visibleSilences, {
    loadingObject: (
      <DataGridRow>
        <DataGridCell colSpan={3}>
          <Stack gap="3" alignment="center" direction="horizontal">
            Loading...
            <Spinner />
          </Stack>
        </DataGridCell>
      </DataGridRow>
    ),
    refFunction: (ref) => (
      <DataGridRow>
        <DataGridCell colSpan={3} className="border-b-0 py-0">
          <span ref={ref} />
        </DataGridCell>
      </DataGridRow>
    ),
  })

  return (
    <>
      <Stack direction="horizontal" className={`${filtersStyles}`}>
        <Select
          className="w-3/12"
          label="Status"
          value={status}
          onChange={(newSilencesStatus) => {
            setSilencesStatus(newSilencesStatus)
          }}
        >
          <SelectOption value={constants.SILENCE_ACTIVE} />
          <SelectOption value={constants.SILENCE_PENDING} />
          <SelectOption value={constants.SILENCE_EXPIRED} />
        </Select>

        <SearchInput
          placeholder="search term or regular expression"
          className="ml-auto w-7/12"
          value={regEx || ""}
          onChange={(text) => {
            handleSearchChange(text)
          }}
          onSearch={(text) => {
            setSilencesRegEx(text)
          }}
          onClear={() => {
            setSilencesRegEx(null)
          }}
        />
      </Stack>

      <DataGrid columns={3} cellVerticalAlignment="top" className="silences">
        {!isSilencesLoading && (
          <>
            <DataGridRow>
              <DataGridHeadCell>Timeintervall</DataGridHeadCell>
              <DataGridHeadCell>Comment</DataGridHeadCell>
              <DataGridHeadCell>Matchers</DataGridHeadCell>
            </DataGridRow>
            {scrollListItems?.length > 0 ? (
              iterator.map((silence) => (
                <SilencesItem silence={silence} key={silence.id} />
              ))
            ) : (
              <DataGridRow>
                <DataGridCell colSpan={3}>
                  <Stack gap="3">
                    <Icon icon="info" color="text-theme-info" />
                    <div>We couldn't find any matching silences.</div>
                  </Stack>
                </DataGridCell>
              </DataGridRow>
            )}
          </>
        )}
      </DataGrid>
    </>
  )
}

export default SilencesList
