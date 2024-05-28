# SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Greenhouse contributors
# SPDX-License-Identifier: Apache-2.0

FROM alpine/git:v2.43.4 as git

RUN git clone https://github.com/cloudoperators/greenhouse.git /greenhouse 

FROM node:18.20-alpine3.18 as node
LABEL source_repository="https://github.com/cloudoperators/greenhouse"
WORKDIR /app
COPY ./secretProps.json /app
COPY --from=git /greenhouse/ui/dashboard /app
COPY --from=git /greenhouse/ui/helpers/appProps.js /helpers/appProps.js
RUN cd /app && npm add -D esbuild && npm install && npm run build

CMD [ "npm", "start"]

