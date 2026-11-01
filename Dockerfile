FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
RUN mkdir /site && chown 1001:1001 /site
USER 1001:1001
ENV HOME=/tmp
WORKDIR /site
COPY --chown=1001:1001 package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY --chown=1001:1001 . .
CMD ["node", "builder.mjs"]
