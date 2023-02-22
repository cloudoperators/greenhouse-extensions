import React from "react"
import {
  Button,
  ContentAreaToolbar,
  Container,
  Message,
  Spinner,
  Stack,
} from "juno-ui-components"
import useStore from "./store"
import { useQuery } from "react-query"
import { fetchAlerts } from "./actions"
import { currentState, push } from "url-state-provider"

const AppContent = (props) => {
  const endpoint = useStore((state) => state.endpoint)
  const urlStateKey = useStore((state) => state.urlStateKey)

  const { isLoading, isError, data, error } = useQuery(
    ["alerts", endpoint, {}],
    fetchAlerts,
    {
      // enable the query also if the endpoint is set. For fetching local
      // data is not necessary since it should be empty
      enabled: !!endpoint,
      // If set to Infinity, the data will never be considered stale
      //  until a browser reload is triggered
      staleTime: Infinity,
      // refer to this documentation to see more options
      // https://tanstack.com/query/v4/docs/guides/queries
    }
  )

  const openNewItemForm = () => {
    const urlState = currentState(urlStateKey)
    push(urlStateKey, { ...urlState, newItemFormOpened: true })
  }

  return (
    <Container px py>


      {isError && (
        <Message variant="danger" className="mb-4">
          {`${error.statusCode}, ${error.message}`}
        </Message>
      )}

      {/* Add a toolbar  */}
      <ContentAreaToolbar>
        {data ? 
          `We have ${data?.length} alerts`
          :
          <>&nbsp;</>
        }
      </ContentAreaToolbar>
      
      <Container px={false} py>
        {isLoading && 
          <Stack gap="2"><span>Loading</span><Spinner variant="primary" /></Stack>
        }
      </Container>
      
    </Container>
  )
}

export default AppContent
