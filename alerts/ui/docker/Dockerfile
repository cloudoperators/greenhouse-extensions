FROM node:20-alpine as build

# we need jq to read and manipulate package.json
RUN apk add --no-cache jq
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
      import props from "/appProps.js"
      const root = document.getElementById("root")
      mount(root, { props})
    </script>
  </body>
</html>
EOF

RUN rm /app/entry_file

FROM nginx:alpine

COPY --from=build /app /usr/share/nginx/html

ENV ENDPOINT=""
ENV THEME="theme-dark"
ENV ENDPOINT="" 
ENV FILTER_LABELS="" 
ENV SILENCE_EXCLUDED_LABELS=""
ENV SILENCE_TEMPLATES=""

# Create Entrypoint which creates /app/appProps.js from ENVs
# Environment variables are known at runtime, so we can use them to create a file that will be used by the app
RUN cat <<EOF > /supernova_entrypoint.sh
#!/bin/sh
echo "export default {endpoint: \"\$ENDPOINT\", theme: \"\$THEME\", embedded: false, silenceExcludedLabels: \"\$SILENCE_EXCLUDED_LABELS\", silenceTemplates: \"\$SILENCE_TEMPLATES\"}" > /usr/share/nginx/html/appProps.js
exec "\$@"
EOF

RUN chmod +x /supernova_entrypoint.sh

ENTRYPOINT [ "/supernova_entrypoint.sh" ]

# run nginx 
CMD ["nginx", "-g", "daemon off;"]

WORKDIR /usr/share/nginx/html
