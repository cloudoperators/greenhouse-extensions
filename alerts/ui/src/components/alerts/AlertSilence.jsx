import React, { useMemo, useState } from "react"
import {
  Modal,
  Button,
  Box,
  Form,
  TextareaRow,
  TextInputRow,
  SelectRow,
  SelectOption,
} from "juno-ui-components"
import AlertLabels from "./AlertLabels"
import { Markup } from "interweave"
import { descriptionParsed } from "../../lib/utils"
import { useAuthData } from "../../hooks/useStore"

const AlertSilence = ({ alert }) => {
  const [displaySilence, setDisplaySilence] = useState(false)
  const authData = useAuthData()

  const name = useMemo(() => {
    return authData?.parsed?.fullName
  }, [authData])

  const title = useMemo(() => {
    if (!alert) return
    return `New Silence for alert ${alert?.labels?.alertname}`
  }, [alert])

  return (
    <>
      <Button size="small" onClick={() => setDisplaySilence(!displaySilence)}>
        Silence
      </Button>
      {displaySilence && (
        <Modal
          title={title}
          size="large"
          open={true}
          onCancel={function noRefCheck() {}}
          onConfirm={null}
        >
          <AlertLabels alert={alert} />
          <Box className="mt-4">
            <Markup
              content={descriptionParsed(
                alert.annotations?.description?.replace(
                  /`([^`]+)`/g,
                  "<code class='inline-code'>$1</code>"
                )
              )}
              tagName="div"
              className="text-theme-light"
            />
          </Box>
          <Form className="mt-4">
            <TextInputRow
              required
              label="Silenced by"
              value={name}
              disabled
              onBlur={function noRefCheck() {}}
              onChange={function noRefCheck() {}}
              onFocus={function noRefCheck() {}}
            />
            <TextareaRow
              label="Description"
              onChange={function noRefCheck() {}}
              required
            />
            <SelectRow
              required
              label="Duration"
              defaultValue="2h"
              onChange={function noRefCheck() {}}
              onOpenChange={function noRefCheck() {}}
              onValueChange={function noRefCheck() {}}
            >
              <SelectOption label="2 hours" value="2h" />
              <SelectOption label="12 hours" value="12h" />
              <SelectOption label="1 day" value="1d" />
              <SelectOption label="3 days" value="3d" />
              <SelectOption label="7 days" value="7d" />
            </SelectRow>
          </Form>
        </Modal>
      )}
    </>
  )
}

export default AlertSilence
