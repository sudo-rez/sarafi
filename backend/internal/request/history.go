package request

import (
	"context"
	"backend/app"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type (
	History struct {
		ID           primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
		Name         string             `bson:"name" json:"name"`
		RequestBody  any                `bson:"request_body" json:"request_body"`
		ResponseBody any                `bson:"response_body" json:"response_body"`
		StatusCode   int                `bson:"status_code" json:"status_code"`
		URL          string             `bson:"url" json:"url"`
		Method       string             `bson:"method" json:"method"`
		CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
		Errors       []string           `bson:"errors" json:"errors"`
	}
)

var (
	collectionName = "request_history"
)

func (c *History) Save() error {
	if c.ID.IsZero() {
		return c.Create()
	}
	return c.Update()
}
func (c *History) Create() error {
	c.CreatedAt = time.Now()
	_, err := app.MDB.DB.Collection(collectionName).InsertOne(context.Background(), c)
	return err
}
func (c *History) Update() error {
	_, err := app.MDB.DB.Collection(collectionName).UpdateOne(context.Background(), primitive.M{"_id": c.ID}, primitive.M{"$set": c})
	return err
}
func (c *History) Delete() error {
	_, err := app.MDB.DB.Collection(collectionName).DeleteOne(context.Background(), primitive.M{"_id": c.ID})
	return err
}

func (c *History) Find(filter primitive.M) error {
	return app.MDB.DB.Collection(collectionName).FindOne(context.Background(), filter).Decode(c)
}

func (c *History) FindAllByFilterWithPagination(filter primitive.M, page int64, limit int64) ([]History, error) {
	var callBackHistories []History
	cursor, err := app.MDB.DB.Collection(collectionName).Find(context.Background(), filter, &options.FindOptions{
		Skip:  &page,
		Limit: &limit,
	})
	if err != nil {
		return callBackHistories, err
	}
	err = cursor.All(context.Background(), &callBackHistories)
	return callBackHistories, err
}
