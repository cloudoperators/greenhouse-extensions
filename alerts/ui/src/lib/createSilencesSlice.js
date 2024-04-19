/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from "immer"

const initialSilencesState = {
  items: [],
  itemsHash: {},
  itemsByState: {},
  excludedLabels: [],
  isLoading: false,
  isUpdating: false,
  updatedAt: null,
  error: null,
  localItems: {},

  // silence templates for maintanance
  templates: [],
}

const validateTemplates = (templates) => {
  // check if the templates are an array
  if (!Array.isArray(templates)) {
    console.warn(
      "[supernova]::validateTemplates: templates object is not an array"
    )
    return [
      {
        id: "1",
        title: "Invalid template object",
        invalid: "Templates object is not an array",
      },
    ]
  }

  // check if every element in the array is an object
  if (!templates.every((element) => typeof element === "object")) {
    console.warn(
      "[supernova]::validateTemplates: templates object is not an array of objects"
    )
    return [
      {
        id: "1",
        title: "Invalid template object",
        invalid: "Templates object is not an array of objects",
      },
    ]
  }

  // check if every object
  return templates
    ?.map((template, index) => {
      // check if status is active
      if (template?.status === "active") {
        // check if title and discription is a string, fixed_labels is an object and editable_labels is an array of strings
        if (
          typeof template?.title !== "string" ||
          typeof template?.description !== "string" ||
          typeof template?.fixed_labels !== "object" ||
          !Array.isArray(template?.editable_labels) ||
          !template?.editable_labels.every(
            (element) => typeof element === "string"
          )
        ) {
          let brokenElement = "Following elements are not well formed: "

          ;(brokenElement +=
            typeof template?.title !== "string" ? "title " : ""),
            (brokenElement +=
              typeof template?.description !== "string" ? "description " : ""),
            (brokenElement +=
              typeof template?.fixed_labels !== "object"
                ? "fixed_labels "
                : ""),
            (brokenElement += !Array.isArray(template?.editable_labels)
              ? "editable_labels "
              : "")
          return {
            id: "elem" + index,
            title:
              typeof template?.title === "string"
                ? template?.title
                : "Invalid template",
            invalid: brokenElement,
          }
        }
        // if all ok, return the template
        return {
          id: "elem" + index,
          title: template?.title,
          description: template?.description,
          fixed_labels: template?.fixed_labels || {},
          editable_labels: template?.editable_labels || [],
          invalid: false,
        }
      }
      // if status is not active, return null to filter it out
      return null
    })
    .filter((template) => template !== null)
}

const createSilencesSlice = (set, get, options) => ({
  silences: {
    ...initialSilencesState,

    // silence templates for maintanance
    templates: validateTemplates(options?.silenceTemplates),
    actions: {
      setSilences: ({ items, itemsHash, itemsByState }) => {
        if (!items) return

        set(
          produce((state) => {
            state.silences.items = items
            state.silences.itemsHash = itemsHash
            state.silences.itemsByState = itemsByState
            state.silences.isLoading = false
            state.silences.isUpdating = false
            state.silences.updatedAt = Date.now()
            state.silences.error = null
          }),
          false,
          "silences.setSilencesData"
        )

        // check if any local item can be removed
        get().silences.actions.updateLocalItems()
      },
      /* 
      Save temporary created silences to be able to display which alert is silenced
      and who silenced it until the next alert fetch contains the silencedBy reference
      */
      addLocalItem: ({ silence, id, alertFingerprint }) => {
        // enforce silences with id and alertFingerprint
        if (!silence || !id || !alertFingerprint) return
        return set(
          produce((state) => {
            state.silences.localItems = {
              ...get().silences.localItems,
              [id]: {
                ...silence,
                id,
                alertFingerprint,
                type: "local",
              },
            }
          }),
          false,
          "silences.addLocalItem"
        )
      },
      /*
      Remove local silences which are already referenced by an alert
      */
      updateLocalItems: () => {
        const allSilences = get().silences.itemsHash
        let newLocalSilences = { ...get().silences.localItems }
        Object.keys(newLocalSilences).forEach((key) => {
          const alert = get().alerts.actions.getAlertByFingerprint(
            newLocalSilences[key]?.alertFingerprint
          )

          // check if the alert has already the silence reference and if the extern silence already exists
          const silencedBy = alert?.status?.silencedBy
          if (
            silencedBy?.length > 0 &&
            silencedBy?.includes(newLocalSilences[key]?.id) &&
            allSilences[key]
          ) {
            // mark to remove silence
            newLocalSilences[key] = { ...newLocalSilences[key], remove: true }
          }
        })

        // remove silences marked to remove
        const reducedLocalSilences = Object.keys(newLocalSilences)
          .filter((key) => !newLocalSilences[key]?.remove)
          .reduce((obj, key) => {
            obj[key] = newLocalSilences[key]
            return obj
          }, {})

        return set(
          produce((state) => {
            state.silences.localItems = reducedLocalSilences
          }),
          false,
          "silences.updateLocalItems"
        )
      },
      /* 
      Given an alert fingerprint, this function returns all silences referenced by silencingBy. It also 
      check if there are local silences with the same alert fingerprint and return them as well.
      */
      getMappingSilences: (alert) => {
        if (!alert) return
        const externalSilences = get().silences.itemsHash
        let silencedBy = alert?.status?.silencedBy || []

        // ensure silencedBy is an array
        if (!Array.isArray(silencedBy)) silencedBy = [silencedBy]
        let mappingSilences = []
        silencedBy.forEach((id) => {
          if (externalSilences[id]) {
            mappingSilences.push(externalSilences[id])
          }
        })

        // add local silences
        let localSilences = get().silences.localItems
        Object.keys(localSilences).forEach((silenceID) => {
          // if there is already a silence with the same id, skip it and exists as external silence
          if (silencedBy.includes(silenceID) && externalSilences[silenceID])
            return
          // if the local silence has the same alert fingerprint, add it to the mapping silences
          if (
            localSilences[silenceID]?.alertFingerprint === alert?.fingerprint
          ) {
            mappingSilences.push(localSilences[silenceID])
          }
        })
        return mappingSilences
      },
      /*
      Return the state of an alert. If the alert is silenced by a local silence, the state is suppressed (processing)
      */
      getMappedState: (alert) => {
        if (!alert) return
        // get all silences (local and external)
        const silences = get().silences.actions.getMappingSilences(alert)
        // if there is a silence with type local, return suppressed (processing)
        if (silences?.find((silence) => silence?.type === "local")) {
          return { type: "suppressed", isProcessing: true }
        }
        return { type: alert?.status?.state, isProcessing: false }
      },
      setExcludedLabels: (labels) => {
        return set(
          (state) => {
            // check if labels is an array and if every element in the array is a string
            if (
              !Array.isArray(labels) ||
              !labels.some((element) => typeof element === "string")
            ) {
              console.warn(
                "[supernova]::setExcludedLabels: labels object is not an array of strings"
              )
              return state
            }

            return {
              silences: {
                ...state.silences,
                excludedLabels: labels,
              },
            }
          },
          false,
          "silences.setExcludedLabels"
        )
      },
      /*
      Find all silences in itemsByState with key expired that matches all labels (key&value) from the alert but omit the labels that are excluded (excludedLabels)
      */
      getExpiredSilences: (alert) => {
        if (!alert) return
        const alertLabels = alert?.labels || {}
        const silences = get().silences.itemsByState?.expired || []
        const excludedLabels = get().silences.excludedLabels || []
        const enrichedLabels = get().alerts.enrichedLabels || []
        // combine the arrays containing the labels that shouldn't be used for matching into one for easier checking
        const labelsExcludedForMatching = [...excludedLabels, ...enrichedLabels]

        // find all expired silences that matches all labels from the alert excluding the excluded excludedLabels
        return silences.filter((silence) => {
          const silenceMatchers = silence?.matchers || []
          // check if all labels from the alert are included in the silence
          return Object.keys(alertLabels).every((label) => {
            // check if the label is excluded
            if (labelsExcludedForMatching.includes(label)) return true
            // check if the label is included in the silence
            return silenceMatchers.some(
              (silenceLabel) =>
                silenceLabel?.name === label &&
                silenceLabel?.value === alertLabels?.[label]
            )
          })
        })
      },
      /*
        Returns the silence (including the local ones) with the latest expiration time for an alert. Useful to display when the alert will be active again.
      */
      getLatestMappingSilence: (alert) => {
        if (!alert) return
        const silences = get().silences.actions.getMappingSilences(alert)
        if (!silences?.length) return
        // return the latest expired silence
        return silences.reduce((prev, current) =>
          prev.endsAt > current.endsAt ? prev : current
        )
      },
      setIsLoading: (value) =>
        set(
          (state) => ({ silences: { ...state.silences, isLoading: value } }),
          false,
          "silences.setIsLoading"
        ),
      setIsUpdating: (value) =>
        set(
          (state) => ({
            silences: { ...state.silences, isUpdating: value },
          }),
          false,
          "silences.setIsUpdating"
        ),
      setError: (error) => {
        set(
          (state) => ({
            silences: { ...state.silences, error, isLoading: false },
          }),
          false,
          "silences.setError"
        )
      },
    },
  },
})

export default createSilencesSlice
