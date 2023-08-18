package scheduler

import (
	"backend/app"
	"backend/internal/txn"
	"backend/sapc"
	"time"
)

func Run() {
	if app.Cfg.Scheduler.MainQueueInterval > 0 {
		txn.CreateMainQueue()
		go IntervalJob(time.Duration(app.Cfg.Scheduler.MainQueueInterval)*time.Second, txn.UpdateMainQueue)
	}
	if app.Cfg.Scheduler.CloseTxnInterval > 0 {
		txn.CloseExpired()
		go IntervalJob(time.Duration(app.Cfg.Scheduler.CloseTxnInterval)*time.Second, txn.CloseExpired)
	}
	if app.Cfg.Scheduler.UpdateSapcTxnInterval > 0 {
		sapc.UpdateTxns()
		go IntervalJob(time.Duration(app.Cfg.Scheduler.UpdateSapcTxnInterval)*time.Second, sapc.UpdateTxns)
	}
}

func IntervalJob(interval time.Duration, f func()) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		f()
	}
}
