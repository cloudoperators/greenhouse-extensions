import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  useQueryClientFnReady,
  useQueryOptions,
  useActions,
} from "../StoreProvider"
import {
  Pagination,
  Container,
  Stack,
} from "@cloudoperators/juno-ui-components"
import { useActions as messageActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"

const ListController = ({ queryKey, entityName, ListComponent }) => {
  const queryClientFnReady = useQueryClientFnReady()
  const queryOptions = useQueryOptions(queryKey)
  const { setQueryOptions } = useActions()
  const { addMessage, resetMessages } = messageActions()

  const { isLoading, data, error } = useQuery({
    queryKey: [queryKey, queryOptions],
    enabled: !!queryClientFnReady,
  })

  const [currentPage, setCurrentPage] = useState(1)

  const items = useMemo(() => {
    if (!data) return null
    return data?.[entityName]?.edges
  }, [data, entityName])
  console.log("items: ", items)

  useEffect(() => {
    if (!error) return resetMessages()
    addMessage({
      variant: "error",
      text: parseError(error),
    })
  }, [error])

  const pageInfo = useMemo(() => {
    if (!data) return null
    return data?.[entityName]?.pageInfo
  }, [data, entityName])

  const totalPages = useMemo(() => {
    if (!data?.[entityName]?.pageInfo?.pages) return 0
    return data?.[entityName]?.pageInfo?.pages.length
  }, [data?.[entityName]?.pageInfo])

  const onPaginationChanged = (newPage) => {
    setCurrentPage(newPage)
    if (!data?.[entityName]?.pageInfo?.pages) return
    const pages = data?.[entityName]?.pageInfo?.pages
    const currentPageIndex = pages?.findIndex(
      (page) => page?.pageNumber === parseInt(newPage)
    )
    if (currentPageIndex > -1) {
      const after = pages[currentPageIndex]?.after
      setQueryOptions(queryKey, {
        ...queryOptions,
        after: `${after}`,
      })
    }
  }

  const onPressNext = () => {
    onPaginationChanged(parseInt(currentPage) + 1)
  }
  const onPressPrevious = () => {
    onPaginationChanged(parseInt(currentPage) - 1)
  }
  const onKeyPress = (oKey) => {
    if (oKey.code === "Enter") {
      onPaginationChanged(parseInt(oKey.currentTarget.value))
    }
  }

  return (
    <>
      <Container py>
        <ListComponent items={items} isLoading={isLoading} />
      </Container>
      <Stack className="flex justify-end">
        <Pagination
          currentPage={currentPage}
          isFirstPage={currentPage === 1}
          isLastPage={currentPage === totalPages}
          onPressNext={onPressNext}
          onPressPrevious={onPressPrevious}
          onKeyPress={onKeyPress}
          onSelectChange={onPaginationChanged}
          pages={totalPages}
          variant="input"
        />
      </Stack>
    </>
  )
}

export default ListController
