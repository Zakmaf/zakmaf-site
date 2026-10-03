FROM node:22-alpine
RUN mkdir /site && chown 1001:1001 /site
USER 1001:1001
ENV HOME=/tmp
WORKDIR /site
COPY --chown=1001:1001 package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY --chown=1001:1001 . .
CMD ["node", "builder.mjs"]
