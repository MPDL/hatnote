# syntax=docker/dockerfile:1

FROM golang:1.20

# Set destination for COPY
WORKDIR /app

# Add source code
ADD . /app

# Add public ssl certificate
ADD hatnote.crt /etc/ssl/certs/hatnote.crt

# Download Go modules
RUN go mod download

# Build
RUN go build -o ./api

# Optional:
# To bind to a TCP port, runtime parameters must be supplied to the docker command.
# But we can document in the Dockerfile what ports
# the application is going to listen on by default.
# https://docs.docker.com/engine/reference/builder/#expose
EXPOSE 8181

# Run
CMD ./api -logAbsPath=$LOG_ABS_PATH -logLevel=$LOG_LEVEL -appEnvironment=$APP_ENVIRONMENT -appEnvironmentFileDir=$APP_ENVIRONMENT_FILE_DIR