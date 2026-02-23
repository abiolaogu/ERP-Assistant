FROM golang:1.22-alpine AS build
WORKDIR /src
COPY main.go ./
RUN go build -o /out/action-engine .
FROM alpine:3.20
COPY --from=build /out/action-engine /action-engine
CMD ["/action-engine"]
