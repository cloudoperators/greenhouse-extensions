/*import React, { useMemo, useState, useEffect } from "react"
import {
  Pill,
  Stack,
  Button,
  ContentHeading,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
  Select,
  SelectOption,
} from "@cloudoperators/juno-ui-components"
import { request } from "graphql-request"
import {
  useGlobalsQueryClientFnReady,
  useGlobalsShowServiceDetail,
} from "../../hooks/useAppStore"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import LoadElement from "../shared/LoadElement"
import { useActions as messageActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"
import {
  listOfCommaSeparatedObjs,
  severityString,
  highestSeverity,
} from "../shared/Helper"
import createAddOwnersMutation from "../../lib/queries/createAddOwnersMutation" // Import the mutation generator

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
  const [isEditMode, setIsEditMode] = useState(false)
  const [tempSelectedOwners, setTempSelectedOwners] = useState([])

  // Utilize the mutation for adding owners
  const addOwnersToService = useMutation({
    mutationKey: ["addOwnerToService"],
    enabled: !!queryClientFnReady,
  })

  // Handle selection of owners in edit mode
  const handleOwnerSelection = (selectedUsers) => {
    const selectedUsersInfo = selectedUsers.map((selectedUser) => {
      return users?.data?.Users?.edges?.find(
        (user) => user?.node?.uniqueUserId === selectedUser
      ).node
    })
    setTempSelectedOwners(selectedUsersInfo)
  }

  const handleEdit = () => {
    setTempSelectedOwners(selectedOwners)
    setIsEditMode(true)
  }

  const handleSave = () => {
    if (!service || !tempSelectedOwners.length) return

    // Extract the userIds from tempSelectedOwners for mutation
    const userIds = tempSelectedOwners.map((owner) => owner.id)

    addOwnersToService.mutate(
      {
        serviceId: service.id,
        userIds,
      },
      {
        onSuccess: () => {
          setSelectedOwners(tempSelectedOwners) // Save full user info after successful mutation
          setIsEditMode(false)
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

  const handleCancel = () => {
    setTempSelectedOwners([])
    setIsEditMode(false)
    resetMessages()
  }

  return (
    <>
      <Stack direction="vertical" gap="4">
        <Stack direction="horizontal" alignment="center" distribution="between">
          <ContentHeading heading="Service Details" />
          <Stack direction="horizontal" alignment="end" gap="2">
            {isEditMode ? (
              <>
                <Button variant="primary" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="subdued" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </Stack>
        </Stack>
        <DataGrid columns={2}>
          <DataGridRow>
            <DataGridHeadCell>Owner</DataGridHeadCell>

            <DataGridCell>
              <LoadElement
                elem={
                  isEditMode ? (
                    <Stack gap="2" wrap={true}>
                      <Select
                        multiple
                        onChange={handleOwnerSelection}
                        value={tempSelectedOwners.map(
                          (owner) => owner.uniqueUserId
                        )}
                      >
                        {users?.data?.Users?.edges?.map((user, i) => (
                          <SelectOption
                            value={user.node.uniqueUserId}
                            label={user.node.uniqueUserId}
                            key={i}
                          />
                        ))}
                      </Select>
                    </Stack>
                  ) : (
                    <Stack gap="2" wrap={true}>
                      {selectedOwners.length > 0
                        ? selectedOwners.map((owner, i) => (
                            <Pill
                              key={i}
                              pillKey={owner.uniqueUserId}
                              pillKeyLabel={owner.uniqueUserId}
                              pillValue={owner.name}
                              pillValueLabel={owner.name}
                            />
                          ))
                        : service?.owners?.edges?.map((owner, i) => (
                            <Pill
                              key={i}
                              pillKey={owner.node.uniqueUserId}
                              pillKeyLabel={owner.node.uniqueUserId}
                              pillValue={owner.node.name}
                              pillValueLabel={owner.node.name}
                            />
                          ))}
                    </Stack>
                  )
                }
              />
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
        <>
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
                    highestSeverity(
                      componentInstance?.node?.issueMatches?.edges
                    )
                  )}
                </DataGridCell>
              </DataGridRow>
            ))}
          </DataGrid>
        </>
      </Stack>
    </>
  )
}

export default ServicesDetail*/
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
  Select,
  SelectOption,
} from "@cloudoperators/juno-ui-components"
import { request } from "graphql-request"
import {
  useGlobalsQueryClientFnReady,
  useGlobalsShowServiceDetail,
} from "../../hooks/useAppStore"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import LoadElement from "../shared/LoadElement"
import { useActions as messageActions } from "@cloudoperators/juno-messages-provider"
import { parseError } from "../../helpers"
import {
  listOfCommaSeparatedObjs,
  severityString,
  highestSeverity,
} from "../shared/Helper"
import createAddOwnersMutation from "../../lib/queries/createAddOwnersMutation" // Import the mutation generator

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
  const [isEditMode, setIsEditMode] = useState(false)
  const [tempSelectedOwners, setTempSelectedOwners] = useState([])

  // Pre-populate selected owners in edit mode
  useEffect(() => {
    if (service && service.owners?.edges) {
      const preSelectedOwners = service.owners.edges.map((owner) => owner.node)
      setSelectedOwners(preSelectedOwners)
    }
  }, [service])

  // Utilize the mutation for adding owners
  const addOwnersToService = useMutation({
    mutationKey: ["addOwnerToService"],
    enabled: !!queryClientFnReady,
  })

  // Handle selection of owners in edit mode
  const handleOwnerSelection = (selectedUsers) => {
    const selectedUsersInfo = selectedUsers.map((selectedUser) => {
      return users?.data?.Users?.edges?.find(
        (user) => user?.node?.uniqueUserId === selectedUser
      ).node
    })
    setTempSelectedOwners(selectedUsersInfo)
  }

  const handleEdit = () => {
    setTempSelectedOwners(selectedOwners)
    setIsEditMode(true)
  }

  const handleSave = () => {
    if (!service || !tempSelectedOwners.length) return

    // Filter out owners already assigned to the service
    const newOwners = tempSelectedOwners.filter(
      (owner) => !selectedOwners.some((existing) => existing.id === owner.id)
    )

    if (!newOwners.length) {
      setIsEditMode(false) // No new owners to save, just exit edit mode
      return
    }

    // Extract the userIds from newOwners for mutation
    const userIds = newOwners.map((owner) => owner.id)

    addOwnersToService.mutate(
      {
        serviceId: service.id,
        userIds,
      },
      {
        onSuccess: () => {
          setSelectedOwners(tempSelectedOwners) // Save full user info after successful mutation
          setIsEditMode(false)
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

  const handleCancel = () => {
    setTempSelectedOwners([])
    setIsEditMode(false)
    resetMessages()
  }

  return (
    <>
      <Stack direction="vertical" gap="4">
        <Stack direction="horizontal" alignment="center" distribution="between">
          <ContentHeading heading="Service Details" />
          <Stack direction="horizontal" alignment="end" gap="2">
            {isEditMode ? (
              <>
                <Button variant="primary" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="subdued" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </Stack>
        </Stack>
        <DataGrid columns={2}>
          <DataGridRow>
            <DataGridHeadCell>Owner</DataGridHeadCell>

            <DataGridCell>
              <LoadElement
                elem={
                  isEditMode ? (
                    <Stack gap="2" wrap={true}>
                      <Select
                        multiple
                        onChange={handleOwnerSelection}
                        value={tempSelectedOwners.map(
                          (owner) => owner.uniqueUserId
                        )}
                      >
                        {users?.data?.Users?.edges?.map((user, i) => (
                          <SelectOption
                            value={user.node.uniqueUserId}
                            label={user.node.uniqueUserId}
                            key={i}
                          />
                        ))}
                      </Select>
                    </Stack>
                  ) : (
                    <Stack gap="2" wrap={true}>
                      {selectedOwners.length > 0
                        ? selectedOwners.map((owner, i) => (
                            <Pill
                              key={i}
                              pillKey={owner.uniqueUserId}
                              pillKeyLabel={owner.uniqueUserId}
                              pillValue={owner.name}
                              pillValueLabel={owner.name}
                            />
                          ))
                        : service?.owners?.edges?.map((owner, i) => (
                            <Pill
                              key={i}
                              pillKey={owner.node.uniqueUserId}
                              pillKeyLabel={owner.node.uniqueUserId}
                              pillValue={owner.node.name}
                              pillValueLabel={owner.node.name}
                            />
                          ))}
                    </Stack>
                  )
                }
              />
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
        <>
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
                    highestSeverity(
                      componentInstance?.node?.issueMatches?.edges
                    )
                  )}
                </DataGridCell>
              </DataGridRow>
            ))}
          </DataGrid>
        </>
      </Stack>
    </>
  )
}

export default ServicesDetail
