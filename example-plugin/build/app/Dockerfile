# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

FROM alpine/git:v2.47.2 AS git
RUN git clone https://github.com/cloudoperators/greenhouse.git /greenhouse 

FROM node:22.2-alpine3.18 AS node
LABEL source_repository="https://github.com/cloudoperators/greenhouse"
WORKDIR /app
COPY ./secretProps.json /app
COPY --from=git /greenhouse/ui/team-admin /app
COPY --from=git /greenhouse/ui/helpers/appProps.js /appProps.js
RUN cd /app && npm add -D esbuild && npm install -g http-server && npm install && npm run build

CMD ["http-server", "--cors", "-p", "8001", "/app/build"]

