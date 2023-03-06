import { useQuery } from "@tanstack/react-query"
import useStore from "./store"
import { fetchAlerts } from "./actions"

export const queryAlerts = () => {
  const endpoint = useStore((state) => state.endpoint)
  return useQuery({
    queryKey: ["alerts", endpoint, {}],
    queryFn: fetchAlerts,
    // enable the query only if endpoint is available
    enabled: !!endpoint,
    // If set to Infinity, the data will never be considered stale
    //  until a browser reload is triggered
    // staleTime: Infinity,
    // refer to this documentation to see more options
    // https://tanstack.com/query/v4/docs/guides/queries
  })
}
