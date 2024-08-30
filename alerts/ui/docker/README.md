# Supernova Docker Image

This Dockerfile builds a standalone, runnable Supernova image. You can configure application properties using environment variables or by providing a custom appProps.json file via a Docker volume.

## Build the Image

Ensure you are in the `alerts/ui` directory, then build the Docker image with:

```bash
cd alerts/ui
docker build -t supernova -f docker/Dockerfile .
```

## Running the Container

There are two primary methods to run the Supernova container:

### 1. Using a Custom `appProps.json` File

To provide a custom configuration file, mount your `appProps.json` via a Docker volume:

```bash
docker run -v /path/to/your/appProps.json:/appProps.json -p 3010:80 supernova
```

### 2. Using Environment Variables

Alternatively, you can configure the application directly using environment variables:

```bash
docker run -e ENDPOINT="https://alertmanager_url/api/v2" -p 3010:80 supernova
```

### Combining Both Methods

You can also combine both methods by providing a custom appProps.json via a volume and then overriding specific values using environment variables:

```bash
docker run -v /path/to/your/appProps.json:/appProps.json -p 3010:80 -e THEME="theme-light" supernova
```

## Environment Variables

You can customize the Supernova application using the following environment variables:

- **`ENDPOINT`**: Specifies the URL for the Alertmanager API endpoint that the application will interact with.

- **`THEME`**: Determines the visual theme of the application. Available options:

  - `theme-light`: Light theme.
  - `theme-dark`: Dark theme.

- **`FILTER_LABELS`**: An array of labels that will be available in the filter dropdown. These labels allow users to filter alerts based on specific criteria. The `Status` label is included by default, based on the alert status attribute, and cannot be overridden. Example:

  ```json
  ["app", "cluster", "cluster_type"]
  ```

- **`SILENCE_EXCLUDED_LABEL`**: A list of labels that are excluded by default when creating a silence. Users can add these labels through the advanced options in the silence form if needed. Provide these labels as an array of strings. Example:
  ```json
  ["pod", "pod_name", "instance"]
  ```
- **`SILENCE_TEMPLATE`**: An array of pre-defined silence templates that can be used to schedule maintenance windows. Each template is an object with the following properties:
  - **`description`**: A brief description of the template.
  - **`editable_labels`**: An array of strings specifying the labels that users can modify.
  - **`fixed_labels`**: A map containing fixed labels and their corresponding values.
  - **`status`**: The status of the silence.
  - **`title`**: The title of the template.
    Example:
  ```json
  {
    "description": "Weekly maintenance window",
    "editable_labels": ["app", "environment"],
    "fixed_labels": {
      "maintenance": "true",
      "team": "devops"
    },
    "status": "active",
    "title": "Weekly Maintenance"
  }
  ```
