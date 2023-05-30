package txn

import (
	"context"
	"fmt"
	"backend/app"
	"backend/internal/brand"
	"backend/pkg/jwtpayload"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Withdraw struct {
		ID               primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
		Amount           int64              `bson:"amount" json:"amount"`
		Account          string             `bson:"account" json:"account"`
		Remaining        int64              `bson:"remaining" json:"remaining"`
		InProgressAmount int64              `bson:"inprogress_amount" json:"inprogress_amount"`
		Card             string             `bson:"card" json:"card"`
		CreatedAt        time.Time          `bson:"created_at" json:"created_at"`
		UpdatedAt        time.Time          `bson:"updated_at" json:"updated_at"`
		Done             bool               `bson:"done" json:"done"`
		InProgress       bool               `bson:"inprogress" json:"inprogress"`
		Manual           bool               `bson:"manual" json:"manual"`
		Canceled         bool               `bson:"canceled" json:"canceled"`
		Rejected         bool               `bson:"rejected" json:"rejected"`
		Brand            primitive.ObjectID `bson:"brand" json:"brand"`
		Txns             TxnSlice           `bson:"txns" json:"txns"`
		Info             jwtpayload.Info    `bson:"info" json:"info"`
		Callback         Callback           `bson:"callback" json:"callback"`
	}
	WithdrawSlice []Withdraw
)

var (
	WDCollectionName = "withdraw"
)

func (slice WithdrawSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (v Withdraw) Rest() echo.Map {
	return echo.Map{
		"_id":               v.ID,
		"created_at":        v.CreatedAt,
		"update_at":         v.UpdatedAt,
		"amount":            v.Amount,
		"remaining":         v.Remaining,
		"inprogress_amount": v.InProgressAmount,
		"card":              v.Card,
		"done":              v.Done,
		"brand":             v.Brand,
		"account":           v.Account,
		"brand_name":        brand.GetBrandName(v.Brand.Hex()),
		"status":            v.Status(),
	}
}
func (v Withdraw) RestGateWay() echo.Map {
	return echo.Map{
		"_id":               v.ID,
		"created_at":        v.CreatedAt,
		"update_at":         v.UpdatedAt,
		"amount":            v.Amount,
		"remaining":         v.Remaining,
		"inprogress_amount": v.InProgressAmount,
		"pan":               v.Card,
		"done":              v.Done,
		"account":           v.Account,
		"status":            v.Status(),
		"client_ip":         v.Info.ClientIP,
	}
}

func (v Withdraw) Save() error {
	if v.Done && v.Remaining == 0 && !v.Callback.Done {
		if err := v.SendCallBack(); err != nil {
			fmt.Println("send withdraw callback error", err)
		}
	}
	if !v.ID.IsZero() {
		return v.Update()
	}
	return v.Create()
}
func (v *Withdraw) Create() error {
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	v.Remaining = v.Amount
	v.InProgressAmount = 0
	v.Done = false
	v.InProgress = false
	_, err := app.MDB.DB.Collection(WDCollectionName).InsertOne(context.Background(), v)
	return err
}
func (v Withdraw) Update() error {
	v.UpdatedAt = time.Now()
	return app.MDB.UpdateOne(WDCollectionName, bson.M{"_id": v.ID}, bson.M{"$set": v})
}
func (v Withdraw) Status() int {
	if v.Manual {
		return 5
	}
	if v.Canceled {
		return 4
	}
	if v.Rejected {
		return 6
	}
	if v.Done && v.Remaining == 0 {
		return 3
	} else if v.InProgress && v.InProgressAmount > 0 {
		return 2
	}
	return 1
}
func LoadWD(q bson.M) (Withdraw, error) {
	v := new(Withdraw)
	return *v, app.MDB.FindOne(WDCollectionName, q, v)
}

func ListWD(q bson.M) (WithdrawSlice, error) {
	v := new(WithdrawSlice)
	return *v, app.MDB.Find(WDCollectionName, q, v)
}
func RemainingWD(q bson.M) (int64, error) {
	pipe := []bson.M{
		{"$match": q},
		{"$group": bson.M{"_id": nil, "count": bson.M{"$sum": "$remaining"}}},
	}
	tmp := []struct {
		Count int64 `bson:"count"`
	}{{Count: 0}}
	err := app.MDB.Aggregate(WDCollectionName, pipe, &tmp)
	if len(tmp) > 0 {
		return tmp[0].Count, err
	}
	return 0, err

}
func PaidinTimeWD(q bson.M) (int64, error) {
	pipe := []bson.M{
		{"$match": q},
		{"$project": bson.M{"c": bson.M{"$subtract": []interface{}{"$amount", "$remaining"}}}},
		{"$group": bson.M{"_id": nil, "count": bson.M{"$sum": "$c"}}},
	}
	tmp := []struct {
		Count int64 `bson:"count"`
	}{{Count: 0}}
	err := app.MDB.Aggregate(WDCollectionName, pipe, &tmp)
	if len(tmp) > 0 {
		return tmp[0].Count, err
	}
	return 0, err
}

func (v Withdraw) ToQueryParam() string {
	return fmt.Sprint("?_id=", v.ID.Hex(), "&",
		"pan=", v.Info.Pan, "&",
		"amount=", v.Amount, "&",
		"account=", v.Account, "&",
		"status=", v.Status())
}
