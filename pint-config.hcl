# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

parser {
  relaxed = [ ".*.yaml", ".*.alerts", ".*.tpl" ]
}

rule {
  match {
    path = "(.yaml|.yml)"
    command = "lint"
  }
}

rule {
  match {
    path = "(.alerts)"
    command = "lint"
  }
}

rule {
  match {
    path = "(.tpl)"
    command = "lint"
  }
}