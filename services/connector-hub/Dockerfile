FROM golang:1.22-alpine AS build
WORKDIR /src
COPY main.go ./
RUN go build -o /out/connector-hub .
FROM alpine:3.20
COPY --from=build /out/connector-hub /connector-hub
CMD ["/connector-hub"]
