#FROM ruby
#RUN gem install youplot
FROM golang

COPY go.mod go.mod

COPY *.go .
RUN CGO_ENABLED=0 GOOS=linux go build -o main main.go

EXPOSE 8080

CMD ["./main"]