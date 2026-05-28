# Contributing

## Code of Conduct

All members of the project community must abide by the [SAP Open Source Code of Conduct](https://github.com/SAP/.github/blob/main/CODE_OF_CONDUCT.md).
Only by respecting each other we can develop a productive, collaborative community.
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting [a project maintainer](.reuse/dep5).

## Engaging in Our Project

We use GitHub to manage reviews of pull requests.

* If you are a new contributor, see: [Steps to Contribute](#steps-to-contribute)

* Before implementing your change, create an issue that describes the problem you would like to solve or the code that should be enhanced. Please note that you are willing to work on that issue.

* The team will review the issue and decide whether it should be implemented as a pull request. In that case, they will assign the issue to you. If the team decides against picking up the issue, the team will post a comment with an explanation.

## Steps to Contribute

Should you wish to work on an issue, please claim it first by commenting on the GitHub issue that you want to work on. This is to prevent duplicated efforts from other contributors on the same issue.

If you have questions about one of the issues, please comment on them, and one of the maintainers will clarify.

## Contributing Code or Documentation

You are welcome to contribute code in order to fix a bug or to implement a new feature that is logged as an issue.

The following rule governs code contributions:

* Contributions must be licensed under the [Apache 2.0 License](./LICENSE)
* Due to legal reasons, contributors will be asked to accept a Developer Certificate of Origin (DCO) when they create the first pull request to this project. This happens in an automated fashion during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## Adding a new plugin chart

Every Helm chart in this repository is registered in
[`.github/configs/plugins.yaml`](.github/configs/plugins.yaml). This file is
the single source of truth used by:

* `.github/configs/helm-chart-testing.yaml` (rendered from `plugins.yaml`)
* The `helm-release` matrices in `.github/workflows/helm-release.yaml` and
  `.github/workflows/ci-pr-build.yaml`

When you add a new plugin chart:

1. Add an entry under `plugins:` in `.github/configs/plugins.yaml`. See the
   schema documented at the top of that file.
2. Regenerate the chart-testing config:
   ```sh
   .github/scripts/render-ct-config.sh > .github/configs/helm-chart-testing.yaml
   ```
3. Open the PR. The `Plugins Consistency` workflow will fail if a chart is
   missing from `plugins.yaml` or if `helm-chart-testing.yaml` is out of sync.

## Issues and Planning

* We use GitHub issues to track bugs and enhancement requests.

* Please provide as much context as possible when you open an issue. The information you provide must be comprehensive enough to reproduce that issue for the assignee.
