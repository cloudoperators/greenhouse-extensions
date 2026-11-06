#!/usr/bin/env python3
"""Extract a subtree (by default spec.config) from a specific Kubernetes
resource inside a multi-document YAML stream (e.g. a rendered Helm template).

Typical use: pull the `spec.config` out of the OpenTelemetryCollector named
`external` so it can be run standalone (e.g. inside a Docker container).

Example:
    python3 extract_collector_config.py --input /tmp/template.yml
    python3 extract_collector_config.py --input /tmp/template.yml \
        --kind OpenTelemetryCollector --name external \
        --path spec.config --output external-config.yaml
"""

import argparse
import sys

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("error: PyYAML is required (pip install pyyaml)")


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        description=(
            "Search a multi-document YAML file for a resource matching the "
            "given kind/name and extract a subtree from it."
        )
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to the multi-document YAML file (rendered template).",
    )
    parser.add_argument(
        "--kind",
        default="OpenTelemetryCollector",
        help="Resource kind to match (default: OpenTelemetryCollector).",
    )
    parser.add_argument(
        "--name",
        default="external",
        help="metadata.name to match (default: external).",
    )
    parser.add_argument(
        "--path",
        default="spec.config",
        help="Dotted path to the subtree to extract (default: spec.config).",
    )
    parser.add_argument(
        "--output",
        default="-",
        help="Output file path. Use '-' for stdout (default).",
    )
    parser.add_argument(
        "--all",
        dest="all_outdir",
        default=None,
        help=(
            "Extract the subtree from EVERY resource of the given --kind and "
            "write each to <outdir>/<metadata.name>.yaml. Ignores --name/--output."
        ),
    )
    return parser.parse_args(argv)


def load_documents(path):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            documents = list(yaml.safe_load_all(handle))
    except FileNotFoundError:
        sys.exit("error: input file not found: {}".format(path))
    except yaml.YAMLError as exc:
        sys.exit("error: failed to parse YAML in {}: {}".format(path, exc))
    # Drop empty/None documents (common with leading '---' or comment-only docs).
    return [doc for doc in documents if isinstance(doc, dict)]


def find_matches(documents, kind, name):
    matches = []
    for doc in documents:
        if doc.get("kind") != kind:
            continue
        metadata = doc.get("metadata")
        if isinstance(metadata, dict) and metadata.get("name") == name:
            matches.append(doc)
    return matches


def find_all_of_kind(documents, kind):
    resources = []
    for doc in documents:
        if doc.get("kind") != kind:
            continue
        metadata = doc.get("metadata")
        if isinstance(metadata, dict) and metadata.get("name"):
            resources.append((metadata["name"], doc))
    return resources


def walk_path(doc, dotted_path):
    node = doc
    traversed = []
    for key in dotted_path.split("."):
        traversed.append(key)
        if not isinstance(node, dict) or key not in node:
            sys.exit(
                "error: path '{}' not found (missing at '{}')".format(
                    dotted_path, ".".join(traversed)
                )
            )
        node = node[key]
    return node


def main(argv=None):
    args = parse_args(argv)

    documents = load_documents(args.input)

    if args.all_outdir is not None:
        import os

        resources = find_all_of_kind(documents, args.kind)
        if not resources:
            sys.exit(
                "error: no document found with kind='{}'".format(args.kind)
            )
        try:
            os.makedirs(args.all_outdir, exist_ok=True)
        except OSError as exc:
            sys.exit(
                "error: failed to create outdir {}: {}".format(
                    args.all_outdir, exc
                )
            )
        for name, doc in resources:
            subtree = walk_path(doc, args.path)
            rendered = yaml.safe_dump(
                subtree, sort_keys=False, default_flow_style=False
            )
            out_path = os.path.join(args.all_outdir, "{}.yaml".format(name))
            try:
                with open(out_path, "w", encoding="utf-8") as handle:
                    handle.write(rendered)
            except OSError as exc:
                sys.exit("error: failed to write {}: {}".format(out_path, exc))
            sys.stderr.write(
                "wrote {} ({}={}) to {}\n".format(
                    args.path, args.kind, name, out_path
                )
            )
        return

    matches = find_matches(documents, args.kind, args.name)

    if not matches:
        sys.exit(
            "error: no document found with kind='{}' and name='{}'".format(
                args.kind, args.name
            )
        )
    if len(matches) > 1:
        sys.exit(
            "error: {} documents matched kind='{}' name='{}'; "
            "expected exactly one".format(len(matches), args.kind, args.name)
        )

    subtree = walk_path(matches[0], args.path)

    rendered = yaml.safe_dump(
        subtree,
        sort_keys=False,
        default_flow_style=False,
    )

    if args.output == "-":
        sys.stdout.write(rendered)
    else:
        try:
            with open(args.output, "w", encoding="utf-8") as handle:
                handle.write(rendered)
        except OSError as exc:
            sys.exit("error: failed to write {}: {}".format(args.output, exc))
        sys.stderr.write("wrote {} to {}\n".format(args.path, args.output))


if __name__ == "__main__":
    main()
