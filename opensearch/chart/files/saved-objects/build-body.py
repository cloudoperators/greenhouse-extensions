# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
"""Build the saved-object create body for an index pattern.

Reads the Dashboards field-caps response from /tmp/fc.json and writes the
index-pattern create body to /tmp/body.json. The field list is baked into the
"fields" attribute so the pattern is not created with an empty field cache
(Dashboards does not populate it on API create). A missing backing index yields
an empty/non-JSON file, in which case the pattern is created without fields.

Env:
  TITLE      index-pattern title (required)
  TIMEFIELD  time field name (optional)
"""
import json
import os
import sys

raw = open("/tmp/fc.json").read().strip()
fields = json.loads(raw).get("fields", []) if raw.startswith("{") else []

attributes = {"title": os.environ["TITLE"]}
if os.environ.get("TIMEFIELD"):
    attributes["timeFieldName"] = os.environ["TIMEFIELD"]
if fields:
    attributes["fields"] = json.dumps(fields)

json.dump({"attributes": attributes}, open("/tmp/body.json", "w"))
sys.stderr.write("baked %d fields\n" % len(fields))
