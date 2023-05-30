package wallet

import (
	"context"
	"backend/app"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (slice HistorySlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (v History) Rest() echo.Map {
	return echo.Map{
		"_id":        v.ID,
		"amount":     v.Amount,
		"currency":   v.Currency,
		"created_at": v.CreatedAt,
		"type":       v.Type,
		"wallet":     v.Wallet,
		"by":         v.By,
	}
}

func LoadHistory(key string, value interface{}) (History, error) {
	v := new(History)
	return *v, app.MDB.FindOne(HistoryCollectionName, bson.M{key: value}, v)
}
func LoadHistories(q bson.M) (HistorySlice, error) {
	v := new(HistorySlice)
	return *v, app.MDB.Find(HistoryCollectionName, q, v)
}

func (v History) Create() error {
	v.CreatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(HistoryCollectionName).InsertOne(context.Background(), v)
	return err
}

func TxnFeeDeduction(brand primitive.ObjectID, amount float64) error {

	wallet, err := Load("brand", brand)
	if err != nil {
		return err
	}
	h := History{
		Type:      "txn_fee",
		Amount:    -1 * amount,
		Currency:  wallet.Currency,
		Wallet:    wallet.ID,
		CreatedAt: time.Now(),
	}
	if err := h.Create(); err != nil {
		return err
	}
	go wallet.Update()
	return nil
}

func ProfitInDay(start, end time.Time, isAdmin bool) (float64, error) {
	q := bson.M{"created_at": bson.M{"$gte": primitive.NewDateTimeFromTime(start), "$lte": primitive.NewDateTimeFromTime(end)}, "type": "txn_fee"}
	if !isAdmin {
		return 0, nil
	}
	h, err := LoadHistories(q)
	if err != nil {
		return 0, err
	}
	var total float64
	for _, v := range h {
		total += v.Amount
	}
	return total, nil
}
