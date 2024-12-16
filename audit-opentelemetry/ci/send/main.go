package main

import (
	"fmt"
	"time"

	"github.com/brianvoe/gofakeit/v7"
	"go.uber.org/zap"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()
	for {
		fmt.Printf("Sleeping...")
		time.Sleep(5 * time.Second)
		logger.Info(fmt.Sprintf("msg-%v", gofakeit.City()),
			zap.Int("PRIORITY", gofakeit.Number(0, 10)),
			zap.String("MESSAGE", gofakeit.ProductDescription()),
			zap.Int("_PID", gofakeit.Number(0, 10000)),
			zap.String("_COMM", gofakeit.Verb()),
			zap.Float32("MEM_USE", gofakeit.Float32Range(0, 1)),
			zap.Float32("CPU_USE", gofakeit.Float32Range(0, 1)))
	}
}
