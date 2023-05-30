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
	// APC stand for Automate Payment Card
	APC struct {
		ID         primitive.ObjectID `bson:"_id,omitempty"`
		CreatedAt  time.Time          `bson:"created_at"`
		UpdatedAt  time.Time          `bson:"updated_at"`
		DeletedAt  time.Time          `bson:"deleted_at"`
		CardNumber string             `bson:"card_number"`
		Name       string             `bson:"name"`
		Bank       string             `bson:"bank"`
		Active     bool               `bson:"active"`
		Current    bool               `bson:"current"`
		Blocked    bool               `bson:"blocked"`
		Confirmed  bool               `bson:"confirmed"`
		Priority   int                `bson:"priority"`
		MaxAmount  int64              `bson:"max_amount"`
		MinAmount  int64              `bson:"min_amount"`
		Brand      primitive.ObjectID `bson:"brand"`
	}
	APCSlice []APC
	APCLog   struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		CreatedAt time.Time          `bson:"created_at"`
		APC       primitive.ObjectID `bson:"apc"`
		Amount    int64              `bson:"amount"`
		Source    string             `bson:"source"`
	}
	APCLogSlice []APCLog
)

var (
	APCCollectionName    = "apc"
	APCLogCollectionName = "apc_log"
)

func (slice APCSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (v APC) Rest() echo.Map {
	tNow := time.Now()
	start := time.Date(tNow.Year(), tNow.Month(), tNow.Day(), 0, 0, 0, 0, tNow.Location())
	end := time.Date(tNow.Year(), tNow.Month(), tNow.Day()+1, 0, 0, 0, 0, tNow.Location())
	log, _ := LoadAPCLogSlice(bson.M{"_id": v.ID})
	amountToday, _ := APCAmountInTime(v.ID, start, end)
	amountAll, _ := APCAmountInTime(v.ID, time.Time{}, end)
	return echo.Map{
		"_id":         v.ID,
		"name":        v.Name,
		"created_at":  v.CreatedAt,
		"updated_at":  v.UpdatedAt,
		"card_number": v.CardNumber,
		"bank":        v.Bank,
		"active":      v.Active,
		"current":     v.Current,
		"priority":    v.Priority,
		"log":         log.Rest(),
		"amount_day":  amountToday,
		"amount_all":  amountAll,
		"blocked":     v.Blocked,
		"confirmed":   v.Confirmed,
	}
}
func (slice APCLogSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (v APCLog) Rest() echo.Map {
	return echo.Map{
		"_id":        v.ID,
		"amount":     v.Amount,
		"created_at": v.CreatedAt,
		"source":     v.Source,
		"apc":        v.APC,
	}
}
func LoadAPC(key string, value interface{}) (APC, error) {
	v := new(APC)
	return *v, app.MDB.FindOne(APCCollectionName, bson.M{key: value}, v)
}
func (v APC) Save() error {
	if !v.ID.IsZero() {
		return v.Update()
	}
	return v.Create()
}
func (v APC) Create() error {
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(APCCollectionName).InsertOne(context.Background(), v)
	return err
}
func (v APC) Update() error {
	v.UpdatedAt = time.Now()
	return app.MDB.UpdateOne(APCCollectionName, bson.M{"_id": v.ID}, bson.M{"$set": v})
}
func (v APC) Delete() error {
	return app.MDB.RemoveOne(APCCollectionName, bson.M{"_id": v.ID})
}
func (v APC) DecurrentOthers() error {
	return app.MDB.UpdateMany(APCCollectionName, bson.M{"_id": bson.M{"$ne": v.ID}}, bson.M{"$set": bson.M{"current": false}})
}
func CreateAPCLog(apc primitive.ObjectID, amount int64, source string) error {
	log := new(APCLog)
	log.CreatedAt = time.Now()
	log.APC = apc
	log.Amount = amount
	log.Source = source
	_, err := app.MDB.Collection(APCLogCollectionName).InsertOne(context.Background(), log)
	return err
}
func LoadAPCLogSlice(q bson.M) (APCLogSlice, error) {
	v := new(APCLogSlice)
	return *v, app.MDB.Find(APCLogCollectionName, q, v)
}
func APCAmountInTime(apc primitive.ObjectID, start, end time.Time) (int64, error) {
	pipe := []bson.M{
		{"$match": bson.M{"apc": apc, "$and": []bson.M{
			{"created_at": bson.M{"$gte": start}},
			{"created_at": bson.M{"$lte": end}}}}},
		{"$group": bson.M{"_id": nil, "sum": bson.M{"$sum": "$amount"}}}}

	var sum struct {
		Sum int64 `bson:"sum"`
	}
	err := app.MDB.Aggregate(APCLogCollectionName, pipe, &sum)
	if err != nil {
		return 0, err
	}
	return sum.Sum, nil
}
func CheckDuplicateAPC(cardNumber string, brand primitive.ObjectID) bool {
	res := APC{}
	app.MDB.FindOne(APCCollectionName, bson.M{"card_number": cardNumber, "brand": brand}, &res)
	return res.CardNumber == cardNumber
}
func GetCurrentAPC(brand primitive.ObjectID) (APC, error) {
	res := APC{}
	err := app.MDB.FindOne(APCCollectionName, bson.M{"current": true, "brand": brand}, &res)
	return res, err
}
func GetWithPriority(brand primitive.ObjectID) (APCSlice, error) {
	res := APCSlice{}
	err := app.MDB.Find(APCCollectionName, bson.M{"brand": brand}, &res, 0, 0, "-priority")
	return res, err
}
func LoadAPCForPayment(amount int64, brand primitive.ObjectID) (APC, error) {
	tNow := time.Now()
	start := time.Date(tNow.Year(), tNow.Month(), tNow.Day(), 0, 0, 0, 0, tNow.Location())
	end := time.Date(tNow.Year(), tNow.Month(), tNow.Day()+1, 0, 0, 0, 0, tNow.Location())

	current, err := GetCurrentAPC(brand)
	if err == nil {
		amountToday, _ := APCAmountInTime(current.ID, start, end)
		if amountToday+amount <= current.MaxAmount {
			return current, err
		}
	} else {
		priorityApcs, err := GetWithPriority(brand)
		if err != nil {
			return APC{}, err
		}

		for _, apc := range priorityApcs {
			amountToday, _ := APCAmountInTime(apc.ID, start, end)
			if amountToday+amount <= apc.MaxAmount || apc.MaxAmount == 0 {
				return apc, nil
			}
		}
	}

	return current, err
}
