package account

import (
	"backend/app"
	"backend/internal/brand"
	"context"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Account struct {
		ID         primitive.ObjectID `bson:"_id,omitempty"`
		Brand      primitive.ObjectID `bson:"brand"`
		Username   string             `bson:"username"`
		Pans       PanSlice           `bson:"pans"`
		TrustLevel int                `bson:"trust_level"`
		CreatedAt  time.Time          `bson:"created_at"`
		UpdatedAt  time.Time          `bson:"updated_at"`
		SAPCActive bool               `bson:"sapc_active"`
	}
	AccountSlice []Account
	Pan          struct {
		Card       string `bson:"card"`
		Mobile     string `bson:"mobile"`
		NationalID string `bson:"national_id"`
		Birthday   string `bson:"birthday"`
	}
	PanSlice []Pan
)

var (
	collectionName = "account"
)

func (v Account) Rest() echo.Map {
	return echo.Map{
		"id":          v.ID,
		"brand":       v.Brand,
		"brand_name":  brand.GetBrandName(v.Brand.Hex()),
		"username":    v.Username,
		"pans":        v.Pans.Rest(),
		"trust_level": v.TrustLevel,
		"created_at":  v.CreatedAt,
		"updated_at":  v.UpdatedAt,
		"sapc_active": v.SAPCActive,
	}
}
func (v AccountSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, p := range v {
		res = append(res, p.Rest())
	}
	return res
}
func (v Pan) Rest() echo.Map {
	return echo.Map{
		"card":        v.Card,
		"mobile":      v.Mobile,
		"national_id": v.NationalID,
		"birthday":    v.Birthday,
	}
}
func (v PanSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, p := range v {
		res = append(res, p.Rest())
	}
	return res
}
func (v Account) Save() error {
	if !v.ID.IsZero() {
		return v.Update()
	}
	return v.Create()
}
func (v Account) Create() error {
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(collectionName).InsertOne(context.Background(), v)
	return err
}
func (v Account) Update() error {
	v.UpdatedAt = time.Now()
	return app.MDB.UpdateOne(collectionName, bson.M{"_id": v.ID}, bson.M{"$set": v})
}
func LoadOrCreateAccount(username string, brandID primitive.ObjectID) (Account, error) {
	a := new(Account)
	err := app.MDB.FindOne(collectionName, bson.M{"username": username, "brand": brandID}, a)
	if err != nil {
		if err.Error() == "mongo: no documents in result" {
			err = nil
			a = &Account{
				Username: username,
				Brand:    brandID,
				Pans:     make(PanSlice, 0),
			}
			if err := a.Save(); err != nil {
				return *a, err
			}
		}
	}
	return *a, err
}
func (v Pan) AddNewPan(username string, brand primitive.ObjectID) error {
	a, err := Load(bson.M{"username": username, "brand": brand})
	if err != nil {
		return err
	}
	flag := false
	for _, p := range a.Pans {
		if p.Card == v.Card {
			flag = true
		}
	}
	if !flag {
		a.Pans = append(a.Pans, v)
	}
	return a.Save()
}
func (v Pan) Split() string {
	if len(v.Card) == 16 {
		return v.Card[0:4] + "-" + v.Card[4:8] + "-" + v.Card[8:12] + "-" + v.Card[12:]
	}
	return ""
}

func Load(q bson.M) (Account, error) {
	v := new(Account)
	return *v, app.MDB.FindOne(collectionName, q, v)
}
func loadSlice(q bson.M, page, limit int, sort string) (AccountSlice, error) {
	v := make(AccountSlice, 0)
	return v, app.MDB.Find(collectionName, q, &v, limit, page, sort)
}
func LoadSlice(page, limit int, search, sort string, brand primitive.ObjectID) (AccountSlice, int, error) {
	q := bson.M{}
	if brand != primitive.NilObjectID {
		q["brand"] = brand
	}
	if search != "" {
		q["$or"] = bson.A{
			bson.M{"username": bson.M{"$regex": search, "$options": "i"}},
			bson.M{"pans.card": bson.M{"$regex": search, "$options": "i"}},
		}
	}
	res, err := loadSlice(q, page, limit, sort)
	if err != nil {
		return res, 0, err
	}
	total, err := app.MDB.Count(collectionName, q)
	return res, total, err
}
