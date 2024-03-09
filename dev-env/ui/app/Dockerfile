FROM alpine/git:2.43.0 as git
RUN git clone https://github.com/sapcc/juno.git /juno 

FROM node:18.16-alpine3.18 as node
LABEL source_repository="https://github.com/sapcc/juno"
WORKDIR /app
COPY --from=git /juno/apps/exampleapp /app
COPY --from=git /juno/helpers/appProps.js /app/appProps.js
COPY ./package.json /app/package.json
COPY ./esbuild.config.js /app/esbuild.config.js
RUN cd /app && npm add -D esbuild && npm install && npm run build

FROM nginx:1.25.3-alpine as nginx
LABEL source_repository="greenhouse"    
COPY --from=node /app /app
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]

