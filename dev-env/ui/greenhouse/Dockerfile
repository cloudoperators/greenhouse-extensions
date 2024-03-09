FROM alpine/git:2.43.0 as git

RUN git clone https://github.com/sapcc/juno.git /juno 

FROM node:18.16-alpine3.18 as node
LABEL source_repository="https://github.com/sapcc/juno"
WORKDIR /app
COPY --from=git /juno/apps/greenhouse /app
COPY --from=git /juno/helpers/appProps.js /helpers/appProps.js
COPY . /app
RUN cd /app && npm add -D esbuild && npm install

ENTRYPOINT [ "npm" ]
CMD [ "run", "start"]

