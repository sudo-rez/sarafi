package txn

import (
	"context"
	"encoding/json"
	"fmt"
	"backend/app"
	"backend/pkg/jwtpayload"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Txn struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		Source       string             `bson:"source"`
		Destination  string             `bson:"destination"`
		Amount       int64              `bson:"amount"`
		Message      string             `bson:"message"`
		SiteRef      string             `bson:"site_ref"`
		CheckoutRef  string             `bson:"checkout_ref"`
		Account      string             `bson:"account"`
		CreatedAt    time.Time          `bson:"created_at"`
		UpdatedAt    time.Time          `bson:"updated_at"`
		ClientIP     string             `bson:"client_ip" faker:"ipv4"`
		PaymentID    string             `bson:"payment_id"`
		BrandName    string             `bson:"brand_name"`
		Brand        primitive.ObjectID `bson:"brand"`
		Done         bool               `bson:"done"`
		ResponseCode int                `bson:"response_code"`
		Successful   bool               `bson:"successful"`
		WithdrawID   primitive.ObjectID `bson:"withdraw,omitempty"`
		Info         jwtpayload.Info    `bson:"info"`
		CallBack     Callback           `bson:"callback"`
		CancelCode   string             `bson:"cancel_code"`
	}
	TxnSlice []Txn
	Echo     struct {
		Prefix string
	}
)

var (
	CollectionName = "txn"
)

func (slice TxnSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (v Txn) Rest() echo.Map {
	return echo.Map{
		"_id":          v.ID,
		"source":       v.Source,
		"destination":  v.Destination,
		"created_at":   v.CreatedAt,
		"update_at":    v.UpdatedAt,
		"amount":       v.Amount,
		"message":      v.Message,
		"site_ref":     v.SiteRef,
		"checkout_ref": v.CheckoutRef,
		"account":      v.Account,
		"payment_id":   v.PaymentID,
		"client_ip":    v.ClientIP,
		"brand_name":   v.BrandName,
		"successful":   v.Successful,
	}
}
func (v Txn) RestGateWay() echo.Map {
	return echo.Map{
		"_id":          v.ID,
		"source":       v.Source,
		"destination":  v.Destination,
		"created_at":   v.CreatedAt,
		"update_at":    v.UpdatedAt,
		"amount":       v.Amount,
		"message":      v.Message,
		"site_ref":     v.SiteRef,
		"checkout_ref": v.CheckoutRef,
		"account":      v.Account,
		"payment_id":   v.PaymentID,
		"client_ip":    v.ClientIP,
		"successful":   v.Successful,
	}
}
func (v Txn) ToQueryParam() string {
	timeFormat := "20060102-15:04:05"
	return fmt.Sprint("?_id=", v.ID.Hex(), "&",
		"source=", v.Source, "&",
		"destination=", v.Destination, "&",
		"created_at=", v.CreatedAt.Format(timeFormat), "&",
		"update_at=", v.UpdatedAt.Format(timeFormat), "&",
		"amount=", v.Amount, "&",
		"message=", v.Message, "&",
		"site_ref=", v.SiteRef, "&",
		"checkout_ref=", v.CheckoutRef, "&",
		"account=", v.Account, "&",
		"payment_id=", v.PaymentID, "&",
		"client_ip=", v.ClientIP, "&",
		"successful=", v.Successful)
}

func (v *Txn) Save() error {
	if !v.ID.IsZero() {
		return v.Update()
	}
	return v.Create()
}
func (v *Txn) Create() error {
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(CollectionName).InsertOne(context.Background(), v)
	return err
}
func (v *Txn) Update() error {
	v.UpdatedAt = time.Now()
	return app.MDB.UpdateOne(CollectionName, bson.M{"_id": v.ID}, bson.M{"$set": v})
}
func Load(q bson.M) (Txn, error) {
	v := new(Txn)
	return *v, app.MDB.FindOne(CollectionName, q, v)
}
func LoadSlice(q bson.M) (TxnSlice, error) {
	v := new(TxnSlice)
	return *v, app.MDB.Find(CollectionName, q, v)
}
func (v Txn) CloseInTime() error {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		t, err := Load(bson.M{"_id": v.ID})
		if err != nil {
			app.Error(err.Error())
			continue
		}
		if !t.Done {
			t.Done = true
			t.Message = "زمان درگاه با پایان رسید"
		}
		if err := t.Save(); err != nil {
			app.Error(err.Error())
		}
	}
	return nil
}
func (v Txn) UpdateWithDraw() error {
	if !v.WithdrawID.IsZero() {
		MQ.mu.Lock()
		defer MQ.mu.Unlock()
		for i := range MQ.BQ[v.BrandName] {
			if MQ.BQ[v.BrandName][i].WD.ID == v.WithdrawID {
				MQ.BQ[v.BrandName][i].WD.Txns = append(MQ.BQ[v.BrandName][i].WD.Txns, v)
				if v.Successful {
					MQ.BQ[v.BrandName][i].WD.InProgressAmount = MQ.BQ[v.BrandName][i].WD.InProgressAmount - v.Amount
					MQ.BQ[v.BrandName][i].WD.Remaining = MQ.BQ[v.BrandName][i].WD.Remaining - v.Amount
					if MQ.BQ[v.BrandName][i].WD.Remaining <= 0 {
						MQ.BQ[v.BrandName][i].WD.InProgress = false
						MQ.BQ[v.BrandName][i].WD.Done = true
					}
				} else {
					MQ.BQ[v.BrandName][i].WD.InProgressAmount = MQ.BQ[v.BrandName][i].WD.InProgressAmount - v.Amount
				}
				go MQ.BQ[v.BrandName][i].WD.Save()
			}
		}
		return nil
	}
	return nil
}

func CloseExpired() {
	set := app.Stg
	q := bson.M{"done": false, "created_at": bson.M{"$lte": time.Now().Add(time.Duration(-1*set.GateWay.OpenTime) * (time.Minute))}}
	txns, err := LoadSlice(q)
	if err != nil {
		app.Error("Close Expired Payments , Load Txns err => ", err.Error())
	}
	for _, txn := range txns {
		txn.Successful = false
		txn.Message = "time-finished"
		txn.Done = true
		if err := txn.Save(); err != nil {
			app.Error("Close Expired Payments ,Save Txn err => ", err.Error())
		}
		if err := txn.UpdateWithDraw(); err != nil {
			app.Error("Close Expired Payments ,Update Withdraw err => ", err.Error())
		}
		if err := txn.SendCallBack(); err != nil {
			flag := true
			for i := 0; i < 5; i++ {
				if err := txn.SendCallBack(); err == nil {
					flag = false
					break
				}
			}
			if flag {
				app.Error("Close Expired Payments ,CallBack err => ", err.Error())
			}
		} else {
			txn.CallBack.Done = true
			txn.Save()
		}
	}
}

func BaseQ(isAdmin bool, brand primitive.ObjectID) bson.M {
	if isAdmin {
		return bson.M{}
	}
	return bson.M{"brand": brand}
}

func TxnAmountCountInDay(q bson.M) (int64, int, error) {
	pipe := []bson.M{
		{"$match": q},
		{"$group": bson.M{"_id": nil, "count": bson.M{"$sum": 1}, "amount": bson.M{"$sum": "$amount"}}},
	}
	b, _ := json.Marshal(pipe)
	fmt.Println(string(b))
	tmp := []struct {
		Amount int64 `bson:"amount"`
		Count  int   `bson:"count"`
	}{{Count: 0, Amount: 0}}
	err := app.MDB.Aggregate(CollectionName, pipe, &tmp)
	fmt.Println(tmp)
	if len(tmp) > 0 {
		return tmp[0].Amount, tmp[0].Count, err
	}
	return 0, 0, err
}

func (v Txn) FeeDeduction(fee float64) float64 {
	return float64(v.Amount) * fee / 100
}
