package txn

import (
	"backend/app"
	"backend/internal/brand"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

type (
	Q struct {
		mu sync.Mutex
		WD Withdraw
	}
	// Withdraw Queue
	WDQ    []Q
	BrandQ struct {
		mu sync.Mutex
		BQ map[string]WDQ
	}
)

var (
	MQ BrandQ
)

func CreateMainQueue() {
	app.Debug("CreateMainQueue Start")
	MQ.BQ = make(map[string]WDQ)

	for _, brand := range brand.BrandList() {

		NotDoneWDs, err := ListWD(bson.M{"brand": brand.ID, "done": false})
		if err != nil {
			app.Error("Error in Getting Withdraws for Brand = ", brand.Name, " error => ", err.Error())
			continue
		}

		brandQueue := make(WDQ, 0)
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
					brandQueue = append(brandQueue, Q{WD: wd})
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

	for _, brand := range brand.BrandList() {

		NotDoneWDs, err := ListWD(bson.M{"brand": brand.ID, "done": false})
		if err != nil {
			app.Error("Error in Getting Withdraws for Brand = ", brand.Name, " error => ", err.Error())
			continue
		}
		for _, wd := range NotDoneWDs {
			if wd.Remaining > 0 && !wd.InProgress {
				wd.InProgress = true
				if err := wd.Save(); err == nil {
					MQ.mu.Lock()
					MQ.BQ[brand.Name] = append(MQ.BQ[brand.Name], Q{WD: wd})
					MQ.mu.Unlock()
				}
			} else if wd.Remaining <= 0 {
				wd.InProgress = false
				wd.Done = true
				if err := wd.Save(); err == nil {
					continue
				}
			}
		}
		app.Debug("Queue For ", brand.Name, " len = ", len(MQ.BQ[brand.Name]))

	}
	app.Debug("UpdateMainQueue Done")

}

// b for brand
func GetFromQueue(amount int64, b string) *Q {
	AlgoDuration := time.Duration(app.Stg.GateWay.AlgorithmDuration) * time.Minute
	if _, ok := MQ.BQ[b]; ok {
		for i := range MQ.BQ[b] {
			if MQ.BQ[b][i].WD.Done {
				continue
			}
			if MQ.BQ[b][i].WD.Remaining-MQ.BQ[b][i].WD.InProgressAmount == amount {
				MQ.BQ[b][i].mu.Lock()
				defer MQ.BQ[b][i].mu.Unlock()

				MQ.BQ[b][i].WD.InProgressAmount = MQ.BQ[b][i].WD.InProgressAmount + amount

				go MQ.BQ[b][i].WD.Save()
				return &MQ.BQ[b][i]
			}

			waitedTime := time.Since(MQ.BQ[b][i].WD.CreatedAt)
			if waitedTime > AlgoDuration && (MQ.BQ[b][i].WD.Remaining-MQ.BQ[b][i].WD.InProgressAmount) > amount {
				mul := int(waitedTime/AlgoDuration) + 1
				for j := 2; j <= mul && j <= 5; j++ {
					for k := 1; k <= 4; k++ {
						if MQ.BQ[b][i].WD.Amount/int64(j)*int64(k) == amount && (MQ.BQ[b][i].WD.Remaining-MQ.BQ[b][i].WD.InProgressAmount) > amount {
							MQ.BQ[b][i].mu.Lock()
							defer MQ.BQ[b][i].mu.Unlock()
							MQ.BQ[b][i].WD.InProgressAmount = MQ.BQ[b][i].WD.InProgressAmount + amount
							go MQ.BQ[b][i].WD.Save()
							return &MQ.BQ[b][i]
						}
					}
				}
			}

		}
	}
	return nil
}
