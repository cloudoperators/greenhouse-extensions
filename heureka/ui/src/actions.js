/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

class HTTPError extends Error {
  constructor(code, message) {
    super(message || code)
    this.name = "HTTPError"
    this.statusCode = code
  }
}

export const encodeUrlParamsFromObject = (options) => {
  if (!options) return ""
  let encodedOptions = Object.keys(options)
    .map((k) => {
      if (typeof options[k] === "object") {
        const childOption = options[k]
        return Object.keys(childOption).map(
          (childKey) =>
            `${encodeURIComponent(childKey)}=${encodeURIComponent(
              childOption[childKey]
            )}`
        )
      }
      return `${encodeURIComponent(k)}=${encodeURIComponent(options[k])}`
    })
    .join("&")
  return `&${encodedOptions}`
}

const checkStatus = (response) => {
  debugger
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

//
// SERVICES
//

export const services = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/services", options)
}

export const service = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, serviceId] = queryKey
  return fetchFromAPI(bearerToken, endpoint, `/services/${serviceId}`)
}

export const serviceFilters = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/services/filters", options)
}

//
// COMPONENTS
//

export const components = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/components", options)
}

export const component = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, componentId] = queryKey
  return fetchFromAPI(bearerToken, endpoint, `/components/${componentId}`)
}

export const componentFilters = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/components/filters", options)
}

//
// ISSUES
//

export const issues = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/issues", options)
}

export const issue = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, issueId] = queryKey
  return fetchFromAPI(bearerToken, endpoint, `/issues/${issueId}`)
}

export const issueFilters = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/issues/filters", options)
}

//
// USERS
//

export const users = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/users", options)
}

export const user = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, userId] = queryKey
  return fetchFromAPI(bearerToken, endpoint, `/users/${userId}`)
}

export const userFilters = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/users/filters", options)
}

//
// COMMONS
//

const fetchFromAPI = (bearerToken, endpoint, path, options) => {
  const query = encodeUrlParamsFromObject(options)
  return fetch(`${endpoint}${path}?${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errData) => {
          const error = new HTTPError(
            response.status,
            errData.message || "Unknown error occurred"
          )
          return Promise.reject(error)
        })
      }

      if (!response.ok) {
        return response.json().then((errData) => {
          const error = new HTTPError(
            response.status,
            errData.message || "Unknown error occurred"
          )
          return Promise.reject(error)
        })
      }

      let isJSON = response.headers
        .get("content-type")
        .includes("application/json")

      if (!isJSON) {
        var error = new HTTPError(
          400,
          "The response is not a valid JSON response"
        )
        return Promise.reject(error)
      }

      return response.json()
    })
    .then((data) => {
      if (data.errors && data.errors.length > 0) {
        const graphQLError = data.errors[0]
        const error = new HTTPError(
          400,
          graphQLError.message || "GraphQL API error occurred"
        )
        return Promise.reject(error)
      }

      return data
    })
    .catch((error) => {
      if (error instanceof HTTPError) {
        throw error
      } else {
        throw new HTTPError(500, "An unexpected error occurred")
      }
    })
}
