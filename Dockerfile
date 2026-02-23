FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY cmd ./cmd
COPY configs ./configs
RUN go build -o /out/assistant ./cmd/server

FROM alpine:3.20
WORKDIR /app
COPY --from=build /out/assistant /app/assistant
COPY configs /app/configs
EXPOSE 8090
CMD ["/app/assistant"]
