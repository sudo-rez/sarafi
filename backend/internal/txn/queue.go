package txn

import (
	"backend/app"
	"backend/internal/brand"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

type (
	// Withdraw Queue
	BrandQ struct {
		mu sync.Mutex
		BQ map[string]map[string]Withdraw
	}
)

var (
	MQ BrandQ
)

func CreateMainQueue() {
	app.Debug("CreateMainQueue Start")
	MQ.BQ = make(map[string]map[string]Withdraw)

	for _, brand := range brand.BrandList() {

		NotDoneWDs, err := ListWD(bson.M{"brand": brand.ID, "done": false})
		if err != nil {
			app.Error("Error in Getting Withdraws for Brand = ", brand.Name, " error => ", err.Error())
			continue
		}

		brandQueue := make(map[string]Withdraw)
		for _, wd := range NotDoneWDs {
			if wd.Remaining <= 0 {
				wd.InProgress = false
				wd.Done = true
				if err := wd.Save(); err == nil {
					continue
				}
			} else {
				wd.InProgress = true
				if err := wd.Save(); err == nil {
					brandQueue[wd.ID.Hex()] = wd
				}
			}

		}
		MQ.mu.Lock()
		MQ.BQ[brand.Name] = brandQueue
		MQ.mu.Unlock()

		app.Debug("Queue For ", brand.Name, " len = ", len(MQ.BQ[brand.Name]))
	}
	app.Debug("CreateMainQueue Done")

}
func UpdateMainQueue() {
	app.Debug("UpdateMainQueue Start")
	MQ.mu.Lock()
	for _, brand := range brand.BrandList() {
		for key, wd := range MQ.BQ[brand.Name] {
			if wd.Done || wd.Remaining == 0 {
				delete(MQ.BQ[brand.Name], key)
				wd.Done = true
				wd.Save()
			}
		}

		NotDoneWDs, err := ListWD(bson.M{"brand": brand.ID, "done": false})
		if err != nil {
			app.Error("Error in Getting Withdraws for Brand = ", brand.Name, " error => ", err.Error())
			continue
		}

		for _, wd := range NotDoneWDs {
			if wd.Remaining > 0 {
				wd.InProgress = true
				MQ.BQ[brand.Name][wd.ID.Hex()] = wd
			} else {
				wd.InProgress = false
				wd.Done = true
				delete(MQ.BQ[brand.Name], wd.ID.Hex())
			}
			wd.Save()
		}
		app.Debug("Queue For ", brand.Name, " len = ", len(MQ.BQ[brand.Name]))
	}
	MQ.mu.Unlock()
	app.Debug("UpdateMainQueue Done")

}

// b for brand
func GetFromQueue(amount int64, b string) *Withdraw {
	MQ.mu.Lock()
	defer MQ.mu.Unlock()
	AlgoDuration := time.Duration(app.Stg.GateWay.AlgorithmDuration) * time.Minute
	if _, ok := MQ.BQ[b]; ok {
		for key, value := range MQ.BQ[b] {
			if value.Done {
				continue
			}
			if value.Remaining-value.InProgressAmount == amount {
				value.InProgressAmount = value.InProgressAmount + amount
				go value.Save()
				MQ.BQ[b][key] = value
				return &value
			}

			waitedTime := time.Since(value.CreatedAt)
			if waitedTime > AlgoDuration && (value.Remaining-value.InProgressAmount) > amount {
				mul := int(waitedTime/AlgoDuration) + 1
				for j := 2; j <= mul && j <= 5; j++ {
					for k := 1; k <= 4; k++ {
						if value.Amount/int64(j)*int64(k) == amount && (value.Remaining-value.InProgressAmount) > amount {
							value.InProgressAmount = value.InProgressAmount + amount
							go value.Save()
							MQ.BQ[b][key] = value
							return &value
						}
					}
				}
			}

		}
	}
	return nil
}
