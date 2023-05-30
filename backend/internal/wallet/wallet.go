package wallet

import (
	"context"
	"backend/app"
	"backend/internal/brand"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Wallet struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		Amount    float64            `bson:"amount"`
		Currency  string             `bson:"currency"`
		Brand     primitive.ObjectID `bson:"brand"`
		CreatedAt time.Time          `bson:"created_at"`
		UpdatedAt time.Time          `bson:"updated_at"`
		History   HistorySlice       `bson:"-"`
	}
	History struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		CreatedAt time.Time          `bson:"created_at"`
		Type      string             `bson:"type"`
		Amount    float64            `bson:"amount"`
		Currency  string             `bson:"currency"`
		Wallet    primitive.ObjectID `bson:"wallet"`
		By        string             `bson:"by"`
	}
	WalletSlice  []Wallet
	HistorySlice []History
	Echo         struct {
		Prefix string
	}
)

var (
	CollectionName        = "wallet"
	HistoryCollectionName = "w_history"
)

func (slice WalletSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}

func (v Wallet) Rest() echo.Map {
	return echo.Map{
		"_id":        v.ID,
		"amount":     v.Amount,
		"currency":   v.Currency,
		"created_at": v.CreatedAt,
		"updated_at": v.UpdatedAt,
		"brand":      v.Brand,
	}
}
func (slice WalletSlice) FullRest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.FullRest())
	}
	return res
}
func (v Wallet) FullRest() echo.Map {
	resp := echo.Map{
		"_id":        v.ID,
		"amount":     v.Amount,
		"currency":   v.Currency,
		"created_at": v.CreatedAt,
		"updated_at": v.UpdatedAt,
		"brand":      v.Brand,
	}
	b, _ := brand.Load("_id", v.Brand)
	resp["brand_name"] = b.Name
	// his, _ := LoadHistories(bson.M{"wallet": v.ID})
	// resp["history"] = his.Rest()
	return resp
}
func Load(key string, value interface{}) (Wallet, error) {
	v := new(Wallet)
	return *v, app.MDB.FindOne(CollectionName, bson.M{key: value}, v)
}
func LoadQ(q bson.M) (Wallet, error) {
	v := new(Wallet)
	return *v, app.MDB.FindOne(CollectionName, q, v)
}
func (v Wallet) Save() error {
	if !v.ID.IsZero() {
		return v.Update()
	}
	return v.Create()
}
func (v Wallet) Create() error {
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(CollectionName).InsertOne(context.Background(), v)
	return err
}
func (v Wallet) Update() error {
	v.UpdatedAt = time.Now()
	v.Amount = v.WalletAmount()
	return app.MDB.UpdateOne(CollectionName, bson.M{"_id": v.ID}, bson.M{"$set": v})
}
func (v Wallet) WalletAmount() float64 {
	pipe := []bson.M{
		{"$match": bson.M{"wallet": v.ID}},
		{"$group": bson.M{"_id": nil, "sum": bson.M{"$sum": "$amount"}}},
	}
	res := []struct {
		Sum float64 `bson:"sum"`
	}{}
	if err := app.MDB.Aggregate(HistoryCollectionName, pipe, &res); err != nil {
		app.Error(err.Error())
	}
	return res[0].Sum
}
