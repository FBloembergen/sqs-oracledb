FROM abcteam/oracledb-container:ferry_node8 as builder
LABEL MAINTAINER 'fbloembergen@gmail.com'

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --quiet

# Bundle app source
COPY . /usr/src/app
RUN npm run build && npm pack && mv sqs-oracledb-*.tgz sqs-oracledb.tgz

#
# SLIM RUNTIME CONTAINER
# ======================
#
FROM abcteam/oracledb-container:ferry_node8 as runner

# Add Tini for older docker versions that don't support the --init flag on `docker run`
ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN mkdir -p /app
WORKDIR /app
COPY --from=builder /usr/src/app/sqs-oracledb.tgz /app/
ENV NODE_ENV production
RUN npm install --quiet --no-save --prod sqs-oracledb.tgz && rm *.tgz && rm -rf ~/.npm

CMD ["/app/node_modules/.bin/sqs-oracledb"]