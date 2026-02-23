FROM golang:1.22-alpine AS build
WORKDIR /src
COPY main.go ./
RUN go build -o /out/assistant-core .
FROM alpine:3.20
COPY --from=build /out/assistant-core /assistant-core
CMD ["/assistant-core"]
