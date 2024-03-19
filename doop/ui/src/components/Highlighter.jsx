/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// V3
import React from "react"
import { useFiltersSearchTerm } from "./StoreProvider"

const SEARCH_NODE_CLASS = "search-node-highlight"
const SEARCH_TERM_LENGTH = 3

// Function to recursively traverse the DOM tree and find text nodes
function findNodes(searchTerm, node = document, nodes = []) {
  if (
    node.nodeType === Node.TEXT_NODE &&
    ["SCRIPT", "TITLE", "STYLE"].indexOf(node.parentNode.tagName) === -1 &&
    node.textContent.toLowerCase().includes(searchTerm.toLowerCase())
  ) {
    nodes.push(node)
  } else {
    // If the current node has child nodes, recursively call the function on each child
    if (node.childNodes && node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        findNodes(searchTerm, node.childNodes[i], nodes)
      }
    }
  }

  // If the current node has a shadow root, recursively call the function on the shadow root
  if (node.shadowRoot) {
    findNodes(searchTerm, node.shadowRoot, nodes)
  }

  return nodes
}

// Function to create MutationObservers for all elements on the page
const createObservers = (callback, config) => {
  // Alle Elemente auf der Seite auswählen
  const allElements = document.querySelectorAll("*")

  // Array für Shadow-Root-Knoten erstellen
  const observedNodes = [document.body]

  // Durch alle Elemente iterieren
  allElements.forEach((element) => {
    // Überprüfen, ob das Element einen Shadow-Root hat
    if (element.shadowRoot) {
      // Das Element hat einen Shadow-Root, also füge es zur Liste hinzu
      observedNodes.push(element.shadowRoot)
    }
  })

  return observedNodes.map((node) => {
    const observer = new MutationObserver(callback)
    observer.observe(node, {
      attributes: true,
      childList: true,
      subtree: true,
    })
    return observer
  })
}

const Highlighter = () => {
  const searchTerm = useFiltersSearchTerm()
  const searchNodes = React.useRef([])

  const [changedAt, setChangeAt] = React.useState(null)

  // draw search overlays
  React.useEffect(() => {
    // replace old search nodes with original nodes
    while (searchNodes.current.length > 0) {
      const { org, search } = searchNodes.current.pop()
      search.replaceWith(org)
    }

    // return if no search term
    if (!searchTerm || searchTerm.length < SEARCH_TERM_LENGTH) return

    // find all nodes containing search term
    let foundNodes = findNodes(searchTerm)
    // replace found nodes with highlighted nodes
    foundNodes.forEach((node) => {
      const index = node.textContent
        .toLowerCase()
        .indexOf(searchTerm.toLowerCase())

      const searchNode = document.createElement("span")
      const highlightNode = document.createElement("span")
      searchNode.className = SEARCH_NODE_CLASS
      highlightNode.className = "bg-theme-warning/40 text-theme-high rounded-sm"

      highlightNode.append(
        node.textContent.slice(index, index + searchTerm.length)
      )
      searchNode.append(node.textContent.slice(0, index))
      searchNode.append(highlightNode)
      searchNode.append(node.textContent.slice(index + searchTerm.length))

      searchNodes.current.push({ org: node, search: searchNode })
      node.replaceWith(searchNode)
    })
  }, [changedAt, searchTerm])

  // observe DOM changes
  React.useEffect(() => {
    const observers = createObservers((mutations) => {
      for (const mutation of mutations) {
        if (!mutation.type === "childList") continue

        // ignore changes to search nodes
        const addedOrRemovedNodes = Array.from(mutation.addedNodes).concat(
          Array.from(mutation.removedNodes)
        )
        let ignore = addedOrRemovedNodes.some((node) =>
          node.classList?.contains(SEARCH_NODE_CLASS)
        )
        if (ignore) continue
        setChangeAt(Date.now())
      }
    })

    return () => {
      // disconnect observers
      observers.forEach((o) => o.disconnect())
    }
  }, [setChangeAt])

  return null
}

export default Highlighter
