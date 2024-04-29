/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
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
// VULNERABILITIES
//

export const vulnerabilities = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(bearerToken, endpoint, "/vulnerabilities", options)
}

export const vulnerability = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, vulnerabilityId] = queryKey
  return fetchFromAPI(
    bearerToken,
    endpoint,
    `/vulnerabilities/${vulnerabilityId}`
  )
}

export const vulnerabilityFilters = ({ queryKey }) => {
  const [_key, bearerToken, endpoint, options] = queryKey
  return fetchFromAPI(
    bearerToken,
    endpoint,
    "/vulnerabilities/filters",
    options
  )
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
    .then(checkStatus)
    .then((response) => {
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
}
