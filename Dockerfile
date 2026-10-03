FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
RUN mkdir /site && chown 1001:1001 /site
USER 1001:1001
ENV HOME=/tmp
WORKDIR /site
COPY --chown=1001:1001 package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY --chown=1001:1001 . .
CMD ["node", "builder.mjs"]
