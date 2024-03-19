/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { valueToLabel } from "../helpers"

const FILTER_TYPE_CLUSTER = "cluster"
const FILTER_TYPE_VIOLATION_GROUP = "violationGroup"
const FILTER_TYPE_CHECK = "check"
/**
 * This function, getClusterFilterItems, takes an object clusterIdentities as input and generates an
 * array of filter items based on the data within this object.
 * It first checks if the input parameter clusterIdentities is falsy (null or undefined).
 * If it is, the function returns an empty array.
 * It initializes an empty object called entries to store the filter items that will be generated.
 * Inside the reduce function, it processes each cluster within the clusterIdentities object:
 * For each cluster, it retrieves the identities associated with that cluster.
 * For each identity within a cluster, it creates a filter item if it doesn't already exist in the filterItems object.
 * Each filter item has a type, key, label, and an array called values.
 * It adds the value associated with the identity to the filter item's values array if it's not already present.
 * After processing all clusters and identities, it returns an array of filter items by extracting the values
 * from the entries object and returning them as an array.
 * This function essentially transforms data about cluster identities into a structured array of filter items,
 * making it easier to work with and display the data. The comments provided in the code offer explanations
 * of each step and the purpose of various operations.
 * @param {Object} clusterIdentities
 * @returns
 */
const getClusterFilterItems = (clusterIdentities) => {
  // Check if clusterIdentities is falsy (null or undefined), and return an empty array if true.
  if (!clusterIdentities) return []

  // Create an object called `entries` to store the filter items that will be generated.
  const entries = Object.keys(clusterIdentities).reduce(
    (filterItems, cluster) => {
      // Get all identities for the current cluster.
      const identities = clusterIdentities[cluster]

      // Iterate through each identity within the cluster.
      Object.keys(identities).forEach((id) => {
        // Get the value associated with the identity.
        const value = identities[id]

        // Create a filter item for the identity if it doesn't exist in filterItems.
        filterItems[id] = filterItems[id] || {
          key: `${FILTER_TYPE_CLUSTER}:${id}`,
          label: valueToLabel(id), // Convert the identity key to a human-readable label.
          values: [],
        }

        // Add the value to the filter item's values array if it's not already present.
        if (filterItems[id].values.indexOf(value) < 0)
          filterItems[id].values.push(value)
      })

      return filterItems // Return the updated filterItems object.
    },
    {}
  )

  // Return an array of filter items by extracting the values from the `entries` object.
  return Object.values(entries)
}

/**
 * This function generates filter items from a list of violation groups.
 * Description:
 * 1. Checks if `violationGroups` is falsy. If so, it returns an empty array.
 * 2. Initializes an empty array `constraints`.
 * 3. Iterates through each `violationGroup` in `violationGroups` and for each `violationGroup`, iterates through
 *    its `constraints`, pushing them into the `constraints` array.
 * 4. Initializes an empty object `entries`.
 * 5. Reduces the `constraints` array to generate filter items.
 * - For each `constraint`:
 *   - Checks if `constraint.metadata.severity` exists.
 *      - If true:
 *        - Retrieves the severity value.
 *        - Initializes a filter item for severity if it doesn't exist.
 *        - Appends the severity value to the list of values for the severity filter item.
 *     - Iterates through each `violation_group` in `constraint`.
 *        - Checks if `violation_group.pattern.object_identity` exists.
 *         - If true:
 *           - Iterates through each `id` in `violation_group.pattern.object_identity`.
 *           - Retrieves the value associated with each `id`.
 *          - Initializes a filter item for the `id` if it doesn't exist.
 *           - Appends the value to the list of values for the respective filter item.
 * 6. Sorts the values of each filter item.
 * 7. Returns an array containing the values of the `entries` object.
 * This function takes an array of violation groups, processes them, and generates an array of
 * filter items based on the constraints and severity levels. The resulting filter items can be used
 * for various purposes, such as filtering and categorizing data related to violations.
 * @param {Array} violationGroups
 * @returns an array of objects representing filter items
 */
const getViolationFilterItems = (
  violationGroups,
  options = { showDebugSeverities: false }
) => {
  if (!violationGroups) return []
  const constraints = []
  violationGroups.forEach((v) =>
    v.constraints.forEach((c) => constraints.push(c))
  )
  const entries = constraints.reduce((filterItems, constraint) => {
    if (constraint?.metadata?.severity) {
      const value = constraint.metadata.severity
      filterItems["severity"] = filterItems["severity"] || {
        key: `${FILTER_TYPE_VIOLATION_GROUP}:severity`,
        label: "severity",
        values: [],
      }
      if (filterItems["severity"].values.indexOf(value) < 0) {
        if (options?.showDebugSeverities || value !== "debug")
          filterItems["severity"].values.push(value)
      }
    }
    constraint?.violation_groups?.forEach((vg) => {
      if (vg?.pattern?.object_identity) {
        Object.keys(vg.pattern.object_identity).forEach((id) => {
          const value = vg.pattern.object_identity[id]
          filterItems[id] = filterItems[id] || {
            key: `${FILTER_TYPE_CHECK}:${id}`,
            label: valueToLabel(id),
            values: [],
          }
          if (filterItems[id].values.indexOf(value) < 0)
            filterItems[id].values.push(value)
        })
      }
    })
    Object.keys(filterItems).forEach((key) => {
      filterItems[key].values.sort()
    })
    return filterItems
  }, {})

  return Object.values(entries)
}

const filterViolations = ({
  violationGroups,
  clusterIdentities,
  activeFilters,
  searchTerm,
  showDebugSeverities,
}) => {
  // initialize items to all violation groups
  let items = violationGroups
  // if showDebugSeverities is false and severity is debug, filter it out
  if (!showDebugSeverities) {
    items = items?.filter((v) => {
      v.constraints = v.constraints?.filter(
        (constraint) => constraint.metadata?.severity !== "debug"
      )
      return v.constraints?.length > 0
    })
  }

  // filter violation groups by active filters
  if (violationGroups && activeFilters?.length > 0) {
    items = []
    const severityFilters = {}
    const checkFilters = {}
    const clusterFilters = {}

    // separate filters by type
    activeFilters.forEach((filter) => {
      const [type, key] = filter.key?.split(":")
      if (type === FILTER_TYPE_VIOLATION_GROUP && key === "severity") {
        severityFilters[key] = severityFilters[key] || []
        severityFilters[key].push(filter.value)
      } else if (type === FILTER_TYPE_CHECK) {
        checkFilters[key] = checkFilters[key] || []
        checkFilters[key].push(filter.value)
      } else if (type === FILTER_TYPE_CLUSTER) {
        clusterFilters[key] = clusterFilters[key] || []
        clusterFilters[key].push(filter.value)
      }
    })
    // filters with the same key are cumulative (OR)
    // filters with different keys are exclusive (AND)
    // Example: (severity:critical OR severity:warning) AND (cluster:cluster1 OR cluster:cluster2)

    // filter violation groups by active filters
    violationGroups.forEach((violation) => {
      // clone the violation group
      const item = JSON.parse(JSON.stringify(violation))

      // collect all constraints that match the filters
      item.constraints = item.constraints?.filter((constraint) => {
        // check if any of the filters match the check
        let found = true

        // ############ CHECK FILTERS ############
        // check if service filters includes the check's service
        if (Object.keys(checkFilters).length > 0) {
          // collect all checks that match the filter
          // object_identity is a map of key/value pairs
          // checkFilters is a map of key/array pairs
          //OR: includes
          //AND: bool &&
          // Example: (service:elektra OR service:castelum) AND (service_group:containers OR service_group:compute)
          constraint.violation_groups = constraint.violation_groups?.filter(
            (vg) =>
              Object.keys(checkFilters).reduce(
                (bool, key) =>
                  bool &&
                  vg.pattern?.object_identity &&
                  checkFilters[key]?.includes(vg.pattern.object_identity[key]),
                true
              )
          )
          found = found && constraint.violation_groups?.length > 0
        }

        // ############ CLUSTER FILTERS ############
        // check if cluster filters includes the check violation group's cluster
        if (Object.keys(clusterFilters).length > 0) {
          // collect all clusters that match the filter
          const clusters = clusterIdentities
            ?.filter((ci) =>
              Object.keys(clusterFilters).reduce(
                (bool, key) => bool && clusterFilters[key].includes(ci[key]),
                true
              )
            )
            .map((ci) => ci.cluster)

          // collect all violation groups that match the clusters
          constraint.violation_groups = constraint.violation_groups?.filter(
            (vg) => {
              // filter out instances that don't match the clusters
              vg.instances = vg.instances.filter((i) =>
                clusters.includes(i.cluster)
              )
              // return true if there are any instances left
              return vg.instances.length > 0
            }
          )
          // set found to false if there are no violation groups left
          found = found && constraint.violation_groups?.length > 0
        }

        // ############ SEVERITY FILTERS ############
        // check if severity filters includes the check's severity
        if (Object.keys(severityFilters).length > 0) {
          found =
            found &&
            Object.values(severityFilters).reduce(
              (bool, values) =>
                bool && values.includes(constraint.metadata?.severity),
              true
            )
        }

        return found
      })

      if (item.constraints?.length > 0) {
        items.push(item)
      }
    })
  }

  // filter items by search term
  if (searchTerm && items) {
    items = items.filter((item) => {
      const constraints = (item.constraints = item.constraints?.filter(
        (constraint) => {
          const { violation_groups, ...data } = constraint
          const foundInData = JSON.stringify(data)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
          const vgs = violation_groups.filter((vg) => {
            const vgString = JSON.stringify(vg)
            return vgString.toLowerCase().includes(searchTerm.toLowerCase())
          })
          constraint.violation_groups = vgs
          return foundInData || vgs.length > 0
        }
      ))
      item.constraints = constraints
      return constraints.length > 0
    })
  }
  return items
}

// extend the violation groups with additional information
const extendAndSortViolations = ({ items, severityWeights }) => {
  if (!items) return []
  return items
    .map((item) => {
      // count the number of violations
      item.violationCount = 0
      // collect all severities and sort them by severity weight
      // first severity is the highest severity
      item.severities = []

      item.constraints?.forEach((constraint) => {
        item.violationCount += constraint.violation_groups?.length || 0
        if (item.severities.indexOf(constraint?.metadata?.severity) < 0) {
          item.severities.push(constraint?.metadata?.severity)
        }
      })
      item.severities = item.severities.sort(
        (a, b) =>
          (severityWeights.indexOf(a) || 100) -
          (severityWeights.indexOf(b) || 100)
      )
      return item
    })
    .sort(
      (a, b) =>
        (severityWeights[a.severities[0]] || 100) -
        (severityWeights[b.severities[0]] || 100) // sort by highest severity
    )
}

// Data slice
const createDataSlice = (set, get) => ({
  data: {
    severityWeights: {
      error: 1,
      warning: 2,
      info: 3,
      debug: 4,
    },
    showDebugSeverities: true,
    loaded: false,
    clusterIdentities: null,
    violationGroups: null,
    filterEntries: [],
    filteredItems: {},
    detailsViolationGroupKind: null,
    detailsViolationGroup: null,

    actions: {
      setShowDebugSeverities: (value) => {
        set((state) => ({
          data: { ...state.data, showDebugSeverities: value },
        }))
      },
      setData: (data) => {
        if (!data) return

        let clusterIdentities = []
        if (data.cluster_identities) {
          clusterIdentities = Object.keys(data.cluster_identities).map(
            (key) => ({ cluster: key, ...data.cluster_identities[key] })
          )
        }

        set(
          (state) => ({
            data: {
              ...state.data,
              loaded: true,
              clusterIdentities,
              violationGroups: data.templates || [],
              filterEntries: [
                ...getClusterFilterItems(data.cluster_identities),
                ...getViolationFilterItems(data.templates, {
                  showDebugSeverities: state.data.showDebugSeverities,
                }),
              ],
            },
          }),
          false,
          "data/setData"
        )
        // filter items
        get().data.actions.filterItems()
      },

      /**
        triggered by: new data data (setData), activeFilters (all actions), searchTerm (new search term set)
       */
      filterItems: () => {
        const violationGroups = get().data.violationGroups
        const clusterIdentities = get().data.clusterIdentities
        const activeFilters = get().filters.active || []
        const searchTerm = get().filters.searchTerm
        const severityWeights = get().data.severityWeights
        let items = filterViolations({
          violationGroups,
          clusterIdentities,
          activeFilters,
          searchTerm,
          showDebugSeverities: get().data.showDebugSeverities,
        })

        items = extendAndSortViolations({ items, severityWeights })

        // save the filtered items
        set(
          (state) => ({
            data: { ...state.data, filteredItems: items },
          }),
          false,
          "data/filterItems"
        )
        // set the details violation group after filtering
        // it can be that the active violation group is not in the filtered items
        get().data.actions.setDetailsViolationGroup()
      },

      setDetailsViolationGroupKind: (detailsViolationGroupKind) => {
        set(
          (state) => ({
            data: {
              ...state.data,
              detailsViolationGroupKind: detailsViolationGroupKind,
            },
          }),
          false,
          "data.setDetailsViolationGroup"
        )
        // set the details violation group
        get().data.actions.setDetailsViolationGroup()
      },
      setDetailsViolationGroup: () => {
        // if there is no active violation group kind, return
        const activeKind = get().data.detailsViolationGroupKind
        if (!activeKind) return
        // find the active violation group in the filtered items
        const activeViolationGroup = get().data.filteredItems?.find(
          (i) => i.kind === activeKind
        )

        // if the active violation group is already set, return
        if (
          get().data.detailsViolationGroup &&
          activeViolationGroup &&
          JSON.stringify(get().data.detailsViolationGroup) ===
            JSON.stringify(activeViolationGroup)
        )
          return
        // set the active violation group
        set(
          (state) => ({
            data: {
              ...state.data,
              detailsViolationGroup: activeViolationGroup,
            },
          }),
          false,
          "data.setDetailsViolationGroup"
        )
      },
    },
  },
})

export default createDataSlice
