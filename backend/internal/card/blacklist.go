package card

import (
	"context"
	"backend/app"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Blacklist struct {
		ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
		Pan       string             `bson:"pan" json:"pan"`
		Reason    string             `bson:"reason" json:"reason"`
		CreatedAt time.Time          `bson:"created_at" json:"created_at"`
		DeletedAt time.Time          `bson:"deleted_at,omitempty" json:"deleted_at"`
	}
	BlacklistSlice []Blacklist
)

var (
	BlacklistCollection = "blacklist"
	DeletedAtOrQuery    = []bson.M{{"deleted_at": bson.M{"$exists": false}}}
)

// Save is a function to save a Blacklist in the database
func (v *Blacklist) Save() error {
	if v.ID.IsZero() {
		return v.Create()
	}
	return v.Update()
}

// Create is a function to create a new Blacklist in the database
func (v *Blacklist) Create() error {
	v.ID = primitive.NewObjectID()
	v.CreatedAt = time.Now()
	_, err := app.MDB.DB.Collection(BlacklistCollection).InsertOne(context.Background(), v)
	return err
}

// Update is a function to update a Blacklist in the database
func (v *Blacklist) Update() error {
	_, err := app.MDB.DB.Collection(BlacklistCollection).UpdateOne(context.Background(), bson.M{"_id": v.ID}, bson.M{"$set": v})
	return err
}

// Delete is a function to delete a Blacklist in the database
func (v *Blacklist) Delete() error {
	v.DeletedAt = time.Now()
	_, err := app.MDB.DB.Collection(BlacklistCollection).UpdateOne(context.Background(), bson.M{"_id": v.ID}, bson.M{"$set": v})
	return err
}

// Find is a function to find a single Blacklist in the database
func (v *Blacklist) Find(q bson.M) error {
	return app.MDB.DB.Collection(BlacklistCollection).FindOne(context.Background(), q).Decode(v)
}

// FindAll is a function to find a list of Blacklist in the database
func (v *BlacklistSlice) FindAll(q bson.M, params ...any) error {
	return app.MDB.Find(BlacklistCollection, bson.M{}, v, params...)
}

func IsInTheBlackList(pan string) bool {
	var blacklist Blacklist
	return blacklist.Find(bson.M{"pan": pan, "$or": DeletedAtOrQuery}) == nil
}
