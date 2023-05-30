package brand

import (
	"context"
	"backend/app"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Brand struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		Name      string             `bson:"name"`
		Logo      string             `bson:"logo"`
		Key       string             `bson:"key"`
		AdminUser string             `bson:"adminuser"`
		CreatedAt time.Time          `bson:"created_at"`
		UpdatedAt time.Time          `bson:"updated_at"`
		Wage      float64            `bson:"wage"`
	}
	BrandSlice []Brand
	Echo       struct {
		Prefix string
	}
)

var (
	CollectionName = "brand"
)

func BrandList() map[string]Brand {
	result := make(map[string]Brand)
	list, err := GetBrands()
	if err != nil {
		app.Error("Error in Getting brand list , error => ", err.Error())
	}
	for _, v := range list {
		result[v.ID.Hex()] = v
	}
	return result
}
func GetBrandName(v string) string {
	objID, _ := primitive.ObjectIDFromHex(v)
	b, _ := Load("_id", objID)
	return b.Name
}
func (slice BrandSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, u := range slice {
		res = append(res, u.Rest())
	}
	return res
}
func (b Brand) Rest() echo.Map {
	return echo.Map{
		"_id":        b.ID,
		"name":       b.Name,
		"adminuser":  b.AdminUser,
		"created_at": b.CreatedAt,
		"updated_at": b.UpdatedAt,
		"logo":       b.Logo,
		"key":        b.Key,
		"wage":       b.Wage,
	}
}
func Load(key string, value interface{}) (Brand, error) {
	b := new(Brand)
	return *b, app.MDB.FindOne(CollectionName, bson.M{key: value}, b)
}
func (b *Brand) Save() error {
	if !b.ID.IsZero() {
		return b.Update()
	}
	return b.Create()
}
func (b *Brand) Create() error {
	b.CreatedAt = time.Now()
	b.UpdatedAt = time.Now()
	b.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(CollectionName).InsertOne(context.Background(), b)
	return err
}
func (b Brand) Update() error {
	b.UpdatedAt = time.Now()
	return app.MDB.UpdateOne(CollectionName, bson.M{"_id": b.ID}, bson.M{"$set": b})
}
func CheckDuplicate(name string) bool {
	res := Brand{}
	app.MDB.FindOne(CollectionName, bson.M{"name": name}, &res)
	return res.Name == name
}
func BaseQ(isAdmin bool, brand primitive.ObjectID) bson.M {
	if !isAdmin {
		return bson.M{"_id": brand}
	}
	return bson.M{}
}
func GetBrands() (BrandSlice, error) {
	res := make(BrandSlice, 0)
	if err := app.MDB.Find(CollectionName, bson.M{}, &res); err != nil {
		return nil, err
	}
	return res, nil
}
func ReadWage(id primitive.ObjectID) float64 {
	b, _ := Load("_id", id)
	return b.Wage
}
