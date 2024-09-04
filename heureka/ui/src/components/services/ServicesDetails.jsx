/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from "react"
import {
  Pill,
  Stack,
  Button,
  ContentHeading,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
  ComboBox,
  ComboBoxOption,
} from "@cloudoperators/juno-ui-components"
import {
  useGlobalsQueryClientFnReady,
  useGlobalsShowServiceDetail,
} from "../../hooks/useAppStore"
import { useQuery, useMutation } from "@tanstack/react-query"
import LoadElement from "../shared/LoadElement"
import { useActions as messageActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"
import {
  listOfCommaSeparatedObjs,
  severityString,
  highestSeverity,
} from "../shared/Helper"

const ServicesDetail = () => {
  const showServiceDetail = useGlobalsShowServiceDetail()
  const queryClientFnReady = useGlobalsQueryClientFnReady()
  const { addMessage, resetMessages } = messageActions()

  const serviceElem = useQuery({
    queryKey: ["Services", { filter: { serviceName: [showServiceDetail] } }],
    enabled: !!queryClientFnReady,
  })

  const users = useQuery({
    queryKey: ["Users"],
    enabled: !!queryClientFnReady,
  })

  const service = useMemo(() => {
    if (!serviceElem) return null
    return serviceElem?.data?.Services?.edges[0]?.node
  }, [serviceElem])

  const [selectedOwners, setSelectedOwners] = useState([])
  const [newOwner, setNewOwner] = useState(null) // Store the full user object
  const [showComboBox, setShowComboBox] = useState(false) // State to control ComboBox visibility

  // Pre-populate selected owners
  useEffect(() => {
    if (service && service.owners?.edges) {
      const preSelectedOwners = service.owners.edges.map((owner) => owner.node)
      setSelectedOwners(preSelectedOwners)
    }
  }, [service])

  // Mutation for adding an owner
  const addOwnerMutation = useMutation({
    mutationKey: ["addOwnerToService"],
    enabled: !!queryClientFnReady,
  })

  // Mutation for removing an owner
  const removeOwnerMutation = useMutation({
    mutationKey: ["removeOwnerFromService"],
    enabled: !!queryClientFnReady,
  })

  // Add a new owner to the service
  const handleAddOwner = () => {
    // Check if the selected user is already in the list of owners
    if (
      newOwner &&
      selectedOwners.some(
        (owner) => owner.uniqueUserId === newOwner.uniqueUserId
      )
    ) {
      addMessage({ variant: "warning", text: "User is already an owner." })
      return
    }

    if (newOwner) {
      addOwnerMutation.mutate(
        {
          serviceId: service.id,
          userId: newOwner.id, // Send the user `id`, not the uniqueUserId
        },
        {
          onSuccess: () => {
            setShowComboBox(false)
            setNewOwner(null)
          },
          onError: (error) => {
            addMessage({
              variant: "error",
              text: parseError(error),
            })
          },
        }
      )
    }
  }

  // Remove an owner from the service
  const handleRemoveOwner = (userId) => {
    removeOwnerMutation.mutate(
      {
        serviceId: service.id,
        userId: userId,
      },
      {
        onError: (error) => {
          addMessage({
            variant: "error",
            text: parseError(error),
          })
        },
      }
    )
  }

  const handleCancelAdd = () => {
    setShowComboBox(false)
    setNewOwner(null)
  }

  return (
    <Stack direction="vertical" gap="4">
      <Stack direction="horizontal" alignment="center" distribution="between">
        <ContentHeading heading="Service Details" />
        <Button
          variant="primary"
          size="small"
          onClick={() => setShowComboBox(true)}
        >
          Add Owner
        </Button>
      </Stack>

      <DataGrid columns={2}>
        <DataGridRow>
          <DataGridHeadCell>Owners</DataGridHeadCell>
          <DataGridCell>
            <Stack gap="2" wrap={true}>
              {selectedOwners.length > 0 &&
                selectedOwners.map((owner, i) => (
                  <Pill
                    key={i}
                    pillValue={owner?.name}
                    pillValueLabel={owner?.name}
                    closeable
                    onClose={() => handleRemoveOwner(owner?.id)}
                  />
                ))}
            </Stack>

            {showComboBox && (
              <Stack direction="horizontal" gap="2" marginTop="2">
                <ComboBox
                  onChange={(selectedUniqueUserId) => {
                    // Find the full user object based on the uniqueUserId from the ComboBox
                    const selectedUser = users?.data?.Users?.edges?.find(
                      (user) => user.node.uniqueUserId === selectedUniqueUserId
                    )?.node
                    setNewOwner(selectedUser) // Set the full user object in state
                  }}
                >
                  {users?.data?.Users?.edges?.map((user, i) => (
                    <ComboBoxOption key={i} value={user?.node?.uniqueUserId}>
                      {user?.node?.name}
                    </ComboBoxOption>
                  ))}
                </ComboBox>
                <Button variant="primary" onClick={handleAddOwner}>
                  Save
                </Button>
                <Button variant="subdued" onClick={handleCancelAdd}>
                  Cancel
                </Button>
              </Stack>
            )}
          </DataGridCell>
        </DataGridRow>

        <DataGridRow>
          <DataGridHeadCell>Support Group</DataGridHeadCell>
          <DataGridCell>
            <LoadElement
              elem={
                <ul>
                  {listOfCommaSeparatedObjs(service?.supportGroups, "name")}
                </ul>
              }
            />
          </DataGridCell>
        </DataGridRow>
      </DataGrid>

      <ContentHeading heading="Component Instances" />
      <DataGrid columns={4}>
        <DataGridRow>
          <DataGridHeadCell>Component</DataGridHeadCell>
          <DataGridHeadCell>Version</DataGridHeadCell>
          <DataGridHeadCell>Total Number of Issues</DataGridHeadCell>
          <DataGridHeadCell>Highest Severity</DataGridHeadCell>
        </DataGridRow>
        {!service?.componentInstances?.edges && (
          <DataGridRow colSpan={4}>
            <LoadElement />
          </DataGridRow>
        )}

        {service?.componentInstances?.edges?.map((componentInstance, i) => (
          <DataGridRow key={i}>
            <DataGridCell>
              {componentInstance?.node?.componentVersion?.component?.name}
            </DataGridCell>
            <DataGridCell>
              {componentInstance?.node?.componentVersion?.version}
            </DataGridCell>
            <DataGridCell>
              {componentInstance?.node?.issueMatches?.totalCount}
            </DataGridCell>
            <DataGridCell>
              {severityString(
                highestSeverity(componentInstance?.node?.issueMatches?.edges)
              )}
            </DataGridCell>
          </DataGridRow>
        ))}
      </DataGrid>
    </Stack>
  )
}

export default ServicesDetail
