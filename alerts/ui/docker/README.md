# Supernova Docker Image

This Dockerfile builds a standalone, runnable Supernova image. You can configure application properties using environment variables.

## Build the Image

Ensure you are in the `alerts/ui` directory, then build the Docker image with:

```bash
docker build -t supernova -f docker/Dockerfile .
```

## Run the Container

```bash
docker run -e ENDPOINT="https://alertmanager_url/api/v2" -e THEME="theme-light" -p 3010:80 supernova
```

## Environment Variables

- **`ENDPOINT`**: The URL for the Alertmanager API endpoint.

- **`THEME`**: The theme of the application. Options include:

  - `theme-light`
  - `theme-dark`

- **`FILTER_LABELS`**: A comma-separated list of labels available in the filter dropdown. These labels allow users to filter alerts based on specific criteria. The `Status` label is a default filter computed from the alert status attribute and will not be overwritten. The labels must be provided as an array of strings. Example: `["app", "cluster", "cluster_type"]`.

- **`SILENCE_EXCLUDED_LABEL`**: Labels that are initially excluded by default when creating a silence. These labels can be added if needed through the advanced options in the silence form. Provide these labels as an array of strings. Example: `["pod", "pod_name", "instance"]`.

- **`SILENCE_TEMPLATE`**: Pre-defined templates used for scheduling Maintenance Windows. Each template is an object that includes:
  - `description`: A brief description of the template.
  - `editable_labels`: An array of strings specifying labels that users can modify.
  - `fixed_labels`: A map of labels and their fixed values that cannot be changed.
  - `status`: The default status for the silence.
  - `title`: A title for the silence template.
