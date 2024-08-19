/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"
import { IntroBox, Container } from "@cloudoperators/juno-ui-components"

const Header = () => (
  <IntroBox>
    <p>
      To perform automatic validations on Kubernetes objects, we run a
      deployment of{" "}
      <a href="https://github.com/open-policy-agent/gatekeeper" target="_blank">
        OPA Gatekeeper{" "}
      </a>{" "}
      in each cluster. This dashboard aggregates all policy violations reported
      by those Gatekeeper instances. <br />
      <br />
      <b>Where are checks defined? How can I add or modify them? </b>
      <br />
      Follow the links in the section headers to the source code. For how to
      write constraints and their templates, check out{" "}
      <a
        href="https://open-policy-agent.github.io/gatekeeper/website/docs/howto/"
        target="_blank"
      >
        this guide from the Gatekeeper documentation.
      </a>
      <br />
      <br />
      <b>Did we improve over time? </b>
      <br />
      To see historical trends, check out the{" "}
      <a
        href="https://plutono.global.cloud.sap/d/doop-overview/doop-overview?orgId=1"
        target="_blank"
      >
        Plutono dashboard.
      </a>
    </p>
  </IntroBox>
)

export default Header
