# GitHub Actions Configuration

This directory contains configuration files for GitHub Actions workflows.

## Dynamic Helm Chart Discovery

The CI/CD workflows now use dynamic chart discovery instead of hardcoded lists. This makes maintenance easier and automatically includes new charts.

### How It Works

1. **Discovery Script**: `.github/scripts/discover-charts.sh` automatically finds all Helm charts in the repository by locating `Chart.yaml` files
2. **Blacklist Configuration**: `.github/configs/chart-blacklist.yaml` allows excluding specific charts from CI/CD workflows
3. **Workflows**: Both `helm-release.yaml` and `ci-pr-build.yaml` use the discovery script to generate a dynamic matrix

### Files

- **`chart-blacklist.yaml`**: Configuration file to exclude charts from CI/CD
- **`helm-chart-testing.yaml`**: Configuration for helm chart testing (chart-dirs now managed dynamically)

### Adding a New Chart

Simply create a new chart directory with a `Chart.yaml` file. It will be automatically discovered and included in CI/CD workflows.

### Excluding a Chart

To exclude a chart from CI/CD workflows, add its path to `.github/configs/chart-blacklist.yaml` (one per line, no quotes needed):

```yaml
# Example blacklist entries:
thanos/charts
experimental-chart/chart
```

The blacklist feature has been tested and verified to work correctly.

### Manual Discovery

You can manually run the discovery script to see which charts will be included:

```bash
# JSON format (for GitHub Actions matrix)
.github/scripts/discover-charts.sh json

# Paths format (for helm-chart-testing)
.github/scripts/discover-charts.sh paths
```

### Benefits

- **Automatic**: New charts are automatically included in CI/CD
- **Maintainable**: No need to update multiple workflow files when adding charts
- **Flexible**: Easy to exclude charts when needed via blacklist
- **Consistent**: Same discovery logic used across all workflows