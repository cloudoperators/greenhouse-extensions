# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

FROM node:20-alpine as build

# we need jq to read and manipulate package.json and upgrade the system
RUN apk add --no-cache jq \
  && apk upgrade --no-cache --no-progress \
  && apk del --no-cache --no-progress apk-tools alpine-keys

# create a directory where we can copy the source code
RUN mkdir -p /tmp/src /app
# copy the source code to the container
ADD . /tmp/src

# remove peerDependencies from package.json
# install dependencies
# build the project 
# copy the build output to /app
# copy favicon.ico to /app
RUN \
  cd /tmp/src && \
  jq 'del(.peerDependencies)' package.json > tmp.json && mv tmp.json package.json && \
  entry_file=$(jq -r '.module // .main' package.json) && \
  echo $entry_file > /app/entry_file && \
  dir=$(dirname $entry_file) && \
  npm install && \
  npm run build && \
  cp -r /tmp/src/$dir /app/ && \
  cp public/favicon.ico /app/

# create index.html  
RUN cat <<EOF > /app/index.html
<!DOCTYPE html>
<html>
  <head>
    <title>Supernova</title>
    <link rel="icon" sizes="any" href="favicon.ico" />
    <style>
      html, body, #root {
        height: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import { mount } from "/$(cat /app/entry_file)"
      const props = await fetch("/appProps.json").then(r => r.json())
      const root = document.getElementById("root")
      mount(root, { props})
    </script>
  </body>
</html>
EOF

# create appProps.js
RUN cat <<EOF > /app/appProps.json
{
  "endpoint": "",
  "theme": "theme-dark",
  "embedded": false,
  "silenceExcludedLabels": "",
  "silenceTemplates": ""
}
EOF

# clean up
RUN rm /app/entry_file

FROM nginx:alpine

RUN apk add --no-cache jq \
  && apk upgrade --no-cache --no-progress \
  && apk del --no-cache --no-progress apk-tools alpine-keys

COPY --from=build /app /usr/share/nginx/html

ENV ENDPOINT=""
ENV THEME=""
ENV ENDPOINT="" 
ENV FILTER_LABELS="" 
ENV SILENCE_EXCLUDED_LABELS=""
ENV SILENCE_TEMPLATES=""

# Create Entrypoint which creates /app/appProps.js from ENVs
# Environment variables are known at runtime, so we can use them to create a file that will be used by the app
RUN cat <<EOF > /supernova_entrypoint.sh
#!/bin/sh
# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

# use jq to overwrite the default values in appProps.json
# if the corresponding environment variables are set

# Define the JSON file path
APP_PROPS_FILE="/usr/share/nginx/html/appProps.json"

# Copy the appProps.json file to the /usr/share/nginx/html directory if it exists
if [ -f /appProps.json ]; then
cp /appProps.json "\${APP_PROPS_FILE}"
fi

# Function to update JSON fields using jq
update_json_field() {
  field="\$1"
  value="\$2"
  if [ -n "\$value" ]; then
    # Ensure jq and temporary file handling are POSIX compliant
    jq --arg v "\$value" ".\${field} = \\\$v" "\$APP_PROPS_FILE" > tmp.json && mv tmp.json "\$APP_PROPS_FILE"
  fi
}

# Update fields if corresponding environment variables are set
update_json_field "endpoint" "\$ENDPOINT"
update_json_field "theme" "\$THEME"
update_json_field "embedded" "\$EMBEDDED"
update_json_field "silenceExcludedLabels" "\$SILENCE_EXCLUDED_LABELS"
update_json_field "silenceTemplates" "\$SILENCE_TEMPLATES"

echo "\$APP_PROPS_FILE has been updated."

cat "\$APP_PROPS_FILE"

exec "\$@"
EOF

RUN chmod +x /supernova_entrypoint.sh

ENTRYPOINT [ "/supernova_entrypoint.sh" ]

# run nginx 
CMD ["nginx", "-g", "daemon off;"]

WORKDIR /usr/share/nginx/html