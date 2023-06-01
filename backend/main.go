package main

import (
	"backend/app"
	"backend/internal/txn"
	"backend/pkg/scheduler"
	"backend/router"
	"flag"
	"os"
	"strings"
)

var (
	fakeTxn = flag.Int("fake-txn", 0, "for fake txn")
	brands  = flag.String("brands", "", "for fake txn, sperated with , ")
)

func main() {
	flag.Parse()
	if *fakeTxn > 0 {
		txn.InsertFakeData(*fakeTxn, strings.Split(*brands, ",")...)
		os.Exit(0)
	}
	app.Info("Version 0.7")

	if app.Cfg.Panel {
		app.Info("Panel Enabled")
		router.RegisterPanel(app.Ec)
		router.RegisterV1(app.Ec)
	}
	if app.Cfg.Gateway {
		app.Info("GateWay Enabled")
		router.RegisterGateway(app.Ec)
	}
	if app.Cfg.Scheduler.Enable {
		scheduler.Run()
	}
	app.Run()
}
