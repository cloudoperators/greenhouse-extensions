# SPDX-FileCopyrightText: 2026 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0
"""Build the create body for an index-pattern saved object.

Reads the index's field list (fetched by the Job into /tmp/fields.json) and
writes the index-pattern create body to /tmp/body.json, baking the fields into
the "fields" attribute. The Job recreates the pattern with overwrite=true on
every run, so without a "fields" attribute each run would reset the cache to
empty and discard any "Refresh field list" done in the UI. Baking the current
fields in keeps the cache populated across runs. When the backing index does
not exist yet the file is empty or non-JSON, and the pattern is created without
fields.
"""
import json
import os
import sys

raw = open("/tmp/fields.json").read().strip()
fields = json.loads(raw).get("fields", []) if raw.startswith("{") else []

attributes = {"title": os.environ["TITLE"]}
if os.environ.get("TIMEFIELD"):
    attributes["timeFieldName"] = os.environ["TIMEFIELD"]
if fields:
    attributes["fields"] = json.dumps(fields)

json.dump({"attributes": attributes}, open("/tmp/body.json", "w"))
sys.stderr.write("baked %d fields\n" % len(fields))
