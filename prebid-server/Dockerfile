# Multi-stage build for Prebid Server
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git

WORKDIR /build

# Clone official Prebid Server and inject PubVibe adapter
RUN git clone --depth 1 https://github.com/prebid/prebid-server.git .

# Copy our custom PubVibe adapter over the cloned repo
COPY adapters/pubvibe/ ./adapters/pubvibe/
COPY static/bidder-info/pubvibe.yaml ./static/bidder-info/pubvibe.yaml
COPY static/bidder-params/pubvibe.json ./static/bidder-params/pubvibe.json

RUN go build -o prebid-server .

# ---- runtime ----
FROM alpine:3.18
WORKDIR /app
COPY --from=builder /build/prebid-server .
COPY --from=builder /build/static ./static
COPY config/prebid-config.yaml ./prebid-config.yaml

EXPOSE 8000 6060 8080

CMD ["./prebid-server", "--config", "prebid-config.yaml"]
