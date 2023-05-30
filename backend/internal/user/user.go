package user

import (
	"context"
	"backend/app"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	User struct {
		ID           primitive.ObjectID `bson:"_id,omitempty"`
		Code         string             `bson:"usercode"`
		Username     string             `bson:"username"`
		Password     string             `bson:"password"`
		CreatedAt    time.Time          `bson:"created_at"`
		UpdatedAt    time.Time          `bson:"updated_at"`
		IsAdmin      bool               `bson:"is_admin"`
		IsBrandAdmin bool               `bson:"is_brandadmin"`
		BrandName    string             `bson:"brand_name"`
		Brand        primitive.ObjectID `bson:"brand"`
		Permissions  map[string]bool    `bson:"permissions"`
	}
	UserSlice []User
	Echo      struct {
		Prefix string
	}
)

var (
	CollectionName = "user"
)

func (slice UserSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (u User) Rest() echo.Map {
	return echo.Map{
		"_id":           u.ID,
		"usercode":      u.Code,
		"username":      u.Username,
		"created_at":    u.CreatedAt,
		"update_at":     u.UpdatedAt,
		"is_admin":      u.IsAdmin,
		"is_brandadmin": u.IsBrandAdmin,
		"brand_name":    u.BrandName,
		"permissions":   u.Permissions,
	}
}

func (v User) Save() error {
	if !v.ID.IsZero() {
		return v.Update()
	}
	return v.Create()
}
func (v User) Create() error {
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(CollectionName).InsertOne(context.Background(), v)
	return err
}
func (v User) Update() error {
	v.UpdatedAt = time.Now()
	return app.MDB.UpdateOne(CollectionName, bson.M{"_id": v.ID}, bson.M{"$set": v})
}
func Load(key string, value interface{}) (User, error) {
	v := new(User)
	return *v, app.MDB.FindOne(CollectionName, bson.M{key: value}, v)
}
func (v User) BaseQ() bson.M {
	if v.IsAdmin {
		return bson.M{"is_admin": false}
	}
	return bson.M{"$or": []bson.M{{"brand_name": v.BrandName}, {"brand": v.Brand}}, "is_admin": false, "is_brandadmin": false}
}

func CheckDuplicate(username string) bool {
	res := User{}
	app.MDB.FindOne("user", bson.M{"username": username}, &res)
	return res.Username == username
}
func AuthUser(username, password, usercode string) (error, bool) {
	u := User{}
	return app.MDB.FindOne(CollectionName, bson.M{"username": username, "usercode": usercode}, &u),
		(u.Username == username && app.DeHash(u.Password) == password)
}
