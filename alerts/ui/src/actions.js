
class HTTPError extends Error {
  constructor(code, message) {
    super(message || code)
    this.name = "HTTPError"
    this.statusCode = code
  }
}

const encodeUrlParamsFromObject = (options) => {
  if (!options) return ""
  let encodedOptions = Object.keys(options)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(options[k])}`)
    .join("&")
  return `&${encodedOptions}`
}

// Check response status
const checkStatus = (response) => {
  if (response.status < 400) {
    return response
  } else {
    return response.text().then((message) => {
      var error = new HTTPError(response.status, message || response.statusText)
      error.statusCode = response.status
      return Promise.reject(error)
    })
  }
}

// Example fetch call. Adjust as needed for your API
export const fetchAlerts = ({ queryKey }) => {
  const [_key, endpoint, options] = queryKey
  const query = encodeUrlParamsFromObject(options)
  // ${options ? `?${query}` : ""}
  return fetch(`${endpoint}/alerts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then(checkStatus)
    .then((response) => {
      return response.json()
    })
}
