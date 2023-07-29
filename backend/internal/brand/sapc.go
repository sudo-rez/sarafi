package brand

import (
	"backend/app"
	"context"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	// SAPC stand for Semi-Automate Payment Card
	SAPC struct {
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
		Brand      primitive.ObjectID `bson:"brand"`
		Username   string             `bson:"username"`
		Password   string             `bson:"password"`
	}
	SAPCSlice []SAPC
	SAPCLog   struct {
		ID        primitive.ObjectID `bson:"_id,omitempty"`
		CreatedAt time.Time          `bson:"created_at"`
		SAPC      primitive.ObjectID `bson:"Sapc"`
		Amount    int64              `bson:"amount"`
		Source    string             `bson:"source"`
	}
	SAPCLogSlice []SAPCLog
)

var (
	SAPCCollectionName    = "sapc"
	SAPCLogCollectionName = "sapc_log"
)

func (slice SAPCSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (v SAPC) Rest() echo.Map {
	tNow := time.Now()
	start := time.Date(tNow.Year(), tNow.Month(), tNow.Day(), 0, 0, 0, 0, tNow.Location())
	end := time.Date(tNow.Year(), tNow.Month(), tNow.Day()+1, 0, 0, 0, 0, tNow.Location())
	log, _ := LoadSAPCLogSlice(bson.M{"_id": v.ID})
	amountToday, _ := SAPCAmountInTime(v.ID, start, end)
	amountAll, _ := SAPCAmountInTime(v.ID, time.Time{}, end)
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
		"username":    v.Username,
		"password":    v.Password,
	}
}
func (slice SAPCLogSlice) Rest() []echo.Map {
	res := make([]echo.Map, 0)
	for _, v := range slice {
		res = append(res, v.Rest())
	}
	return res
}
func (v SAPCLog) Rest() echo.Map {
	return echo.Map{
		"_id":        v.ID,
		"amount":     v.Amount,
		"created_at": v.CreatedAt,
		"source":     v.Source,
		"Sapc":       v.SAPC,
	}
}
func LoadSAPC(key string, value interface{}) (SAPC, error) {
	v := new(SAPC)
	return *v, app.MDB.FindOne(SAPCCollectionName, bson.M{key: value}, v)
}
func LoadSAPCQ(q bson.M) (SAPC, error) {
	v := new(SAPC)
	return *v, app.MDB.FindOne(SAPCCollectionName, q, v)
}
func (v SAPC) Save() error {
	if !v.ID.IsZero() {
		return v.Update()
	}
	return v.Create()
}
func (v SAPC) Create() error {
	v.CreatedAt = time.Now()
	v.UpdatedAt = time.Now()
	v.ID = primitive.NewObjectID()
	_, err := app.MDB.DB.Collection(SAPCCollectionName).InsertOne(context.Background(), v)
	return err
}
func (v SAPC) Update() error {
	v.UpdatedAt = time.Now()
	return app.MDB.UpdateOne(SAPCCollectionName, bson.M{"_id": v.ID}, bson.M{"$set": v})
}
func (v SAPC) Delete() error {
	return app.MDB.RemoveOne(SAPCCollectionName, bson.M{"_id": v.ID})
}
func (v SAPC) DecurrentOthers() error {
	return app.MDB.UpdateMany(SAPCCollectionName, bson.M{"_id": bson.M{"$ne": v.ID}}, bson.M{"$set": bson.M{"current": false}})
}
func CreateSAPCLog(Sapc primitive.ObjectID, amount int64, source string) error {
	log := new(SAPCLog)
	log.CreatedAt = time.Now()
	log.SAPC = Sapc
	log.Amount = amount
	log.Source = source
	_, err := app.MDB.Collection(SAPCLogCollectionName).InsertOne(context.Background(), log)
	return err
}
func LoadSAPCLogSlice(q bson.M) (SAPCLogSlice, error) {
	v := new(SAPCLogSlice)
	return *v, app.MDB.Find(SAPCLogCollectionName, q, v)
}
func SAPCAmountInTime(Sapc primitive.ObjectID, start, end time.Time) (int64, error) {
	pipe := []bson.M{
		{"$match": bson.M{"Sapc": Sapc, "$and": []bson.M{
			{"created_at": bson.M{"$gte": start}},
			{"created_at": bson.M{"$lte": end}}}}},
		{"$group": bson.M{"_id": nil, "sum": bson.M{"$sum": "$amount"}}}}

	var sum struct {
		Sum int64 `bson:"sum"`
	}
	err := app.MDB.Aggregate(SAPCLogCollectionName, pipe, &sum)
	if err != nil {
		return 0, err
	}
	return sum.Sum, nil
}
func CheckDuplicateSAPC(cardNumber string, brand primitive.ObjectID) bool {
	res := SAPC{}
	app.MDB.FindOne(SAPCCollectionName, bson.M{"card_number": cardNumber, "brand": brand}, &res)
	return res.CardNumber == cardNumber
}
func LoadSAPCForPayment(amount int64, brand primitive.ObjectID) (APC, error) {
	// tNow := time.Now()
	// start := time.Date(tNow.Year(), tNow.Month(), tNow.Day(), 0, 0, 0, 0, tNow.Location())
	// end := time.Date(tNow.Year(), tNow.Month(), tNow.Day()+1, 0, 0, 0, 0, tNow.Location())

	current, err := GetCurrentSAPC(brand)
	// if err == nil {
	// 	amountToday, _ := APCAmountInTime(current.ID, start, end)
	// 	if amountToday+amount <= current.MaxAmount {
	// 		return current, err
	// 	}
	// } else {
	// 	priorityApcs, err := GetWithPriority(brand)
	// 	if err != nil {
	// 		return APC{}, err
	// 	}

	// 	for _, apc := range priorityApcs {
	// 		amountToday, _ := APCAmountInTime(apc.ID, start, end)
	// 		if amountToday+amount <= apc.MaxAmount || apc.MaxAmount == 0 {
	// 			return apc, nil
	// 		}
	// 	}
	// }

	return current, err
}
func GetCurrentSAPC(brand primitive.ObjectID) (APC, error) {
	res := APC{}
	err := app.MDB.FindOne(SAPCCollectionName, bson.M{"current": true, "brand": brand}, &res)
	return res, err
}
