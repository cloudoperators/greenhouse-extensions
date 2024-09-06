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
  Icon,
  Modal,
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
  const [confirmRemoveOwner, setConfirmRemoveOwner] = useState(null) // Store user to confirm removal
  const [ownerToRemove, setOwnerToRemove] = useState(null) // Store owner name to remove

  // Pre-populate selected owners
  useEffect(() => {
    if (service && service.owners?.edges) {
      const preSelectedOwners = service.owners.edges.map((owner) => owner.node)
      setSelectedOwners(preSelectedOwners)
    }
  }, [service])

  // Hide ComboBox when service details change (new service selected)
  useEffect(() => {
    // When the service changes, reset the state to hide ComboBox and ensure read-only mode
    setShowComboBox(false)
    setNewOwner(null) // Clear new owner selection as well
    resetMessages()
  }, [service?.id])

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
    if (newOwner) {
      addOwnerMutation.mutate(
        {
          serviceId: service.id,
          userId: newOwner.id,
        },
        {
          onSuccess: () => {
            addMessage({
              variant: "success",
              text: `${newOwner.name} added as owner.`,
            })
            setSelectedOwners((prev) => [...prev, newOwner])
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
        onSuccess: () => {
          const removedUser = selectedOwners.find(
            (owner) => owner.id === userId
          )
          addMessage({
            variant: "success",
            text: `${removedUser.name} removed as owner.`,
          })
          setSelectedOwners((prev) =>
            prev.filter((owner) => owner.id !== userId)
          )
          setConfirmRemoveOwner(null) // Close the modal
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

  const handleCancelAdd = () => {
    setShowComboBox(false)
    setNewOwner(null)
  }

  // Set owner to remove and show confirmation modal
  const handleConfirmRemoveOwner = (owner) => {
    setConfirmRemoveOwner(owner?.id)
    setOwnerToRemove(owner?.name)
  }

  return (
    <Stack direction="vertical" gap="4">
      <ContentHeading heading="Service Details" />

      <DataGrid minContentColumns={[0]} columns={2}>
        <DataGridRow>
          <DataGridHeadCell nowrap={true}>Owners</DataGridHeadCell>
          <DataGridCell>
            {!showComboBox && (
              <Stack gap="2" wrap={true} alignment="center">
                {selectedOwners.length > 0 &&
                  selectedOwners.map((owner, i) => (
                    <Pill
                      key={i}
                      pillValue={owner?.name}
                      pillValueLabel={owner?.name}
                      closeable
                      onClose={() => handleConfirmRemoveOwner(owner)}
                    />
                  ))}
                <Icon
                  color="jn-global-text"
                  icon="addCircle"
                  onClick={() => setShowComboBox(true)}
                  className="ml-2"
                />
              </Stack>
            )}

            {showComboBox && (
              <Stack direction="horizontal" gap="2">
                <ComboBox
                  onChange={(selectedUniqueUserId) => {
                    const selectedUser = users?.data?.Users?.edges?.find(
                      (user) => user.node.uniqueUserId === selectedUniqueUserId
                    )?.node
                    setNewOwner(selectedUser)
                  }}
                >
                  {users?.data?.Users?.edges
                    ?.filter(
                      (user) =>
                        !selectedOwners.some(
                          (owner) =>
                            owner.uniqueUserId === user.node.uniqueUserId
                        )
                    )
                    .map((user, i) => (
                      <ComboBoxOption key={i} value={user?.node?.uniqueUserId}>
                        {user?.node?.name}
                      </ComboBoxOption>
                    ))}
                </ComboBox>
                <Button variant="primary" onClick={handleAddOwner}>
                  Add
                </Button>
                <Button variant="subdued" onClick={handleCancelAdd}>
                  Cancel
                </Button>
              </Stack>
            )}
          </DataGridCell>
        </DataGridRow>

        {/* Modal for remove confirmation */}
        {confirmRemoveOwner && (
          <Modal
            cancelButtonLabel="Cancel"
            confirmButtonLabel="Yes, Proceed"
            open={!!confirmRemoveOwner}
            onCancel={() => setConfirmRemoveOwner(null)}
            onConfirm={() => handleRemoveOwner(confirmRemoveOwner)}
          >
            <p>
              Are you sure you want to remove {ownerToRemove} from the owners?
            </p>
          </Modal>
        )}

        <DataGridRow>
          <DataGridHeadCell nowrap={true}>Support Group</DataGridHeadCell>
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
