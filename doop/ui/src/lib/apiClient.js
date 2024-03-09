// Example fetch call. Adjust as needed for your API
export const fetchData = ({ queryKey, meta }) => {
  if (meta.mock === "true" || meta.mock === true) {
    console.log("====LOAD MOCKED DATA")
    return import("./dataMockV2.js").then((data) => data.default)
  }
  // const [_key, endpoint, options] = queryKey

  // console.log("===ENDPOINT", meta.endpoint)
  return fetch(`${meta.endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }).then((response) => {
    if (response.statusCode >= 400) {
      throw new Error(response.statusText)
    }
    // console.log("fetchData: ", response)
    return response.json()
  })
}
