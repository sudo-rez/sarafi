package sapc

import (
	"backend/app"
	"backend/internal/thirdparty"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type (
	Transaction struct {
		ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
		SrcCard      string             `json:"src_card" bson:"src_card"`
		DesCard      string             `json:"des_card" bson:"des_card"`
		Amount       string             `json:"amount" bson:"amount"`
		TrackingCode string             `json:"tracking_code" bson:"tracking_code"`
		Status       string             `json:"status" bson:"status"`
		Created      time.Time          `json:"created" bson:"created"`
		Flag         int                `json:"flag" bson:"flag"`
	}
)

var (
	txnCollectioName = "sapc_txn"
)

func (v Transaction) Save() error {
	opt := options.Update().SetUpsert(true)
	_, err := app.MDB.CollectionString(txnCollectioName).UpdateOne(context.Background(), bson.M{"id": v.ID}, bson.M{"$set": v}, opt)
	return err
}
func (v *Transaction) Load(filter bson.M) error {
	return app.MDB.CollectionString(txnCollectioName).FindOne(context.Background(), filter).Decode(v)
}

func UpdateTxns() {
	cardLists, _, err := thirdparty.TP.SiteCardList()
	if err != nil {
		app.Error("SAPC SiteCardList failed: " + err.Error())
		return
	}

	for _, card := range cardLists.Item {
		txnResponse, _, err := thirdparty.TP.CardTransaction(card.CardNo)
		if err != nil {
			app.Error("SAPC Transactions failed: " + err.Error())
			return
		}
		if len(txnResponse.Item) == 0 {
			break
		}
		for _, txn := range txnResponse.Item {
			t := new(Transaction)
			t.ID = primitive.NewObjectID()
			t.SrcCard = txn.SrcCard
			t.DesCard = txn.DesCard
			t.Amount = txn.Amount
			t.TrackingCode = txn.TrackingCode
			t.Status = txn.Status
			t.Created, err = time.Parse("2006-01-02 15:04:05", txn.Created)
			if err != nil {
				app.Error("SAPC Transaction Parse Time failed: " + err.Error())
				t.Created = time.Now()
			}

			if err := t.Save(); err != nil {
				app.Error("SAPC Transaction Save failed: " + err.Error())
			}

		}
	}
}

func ConfirmTxn(source, destination, amount string) error {
	txn := new(Transaction)
	q := bson.M{"src_card": source, "amount": amount, "flag": 0, "des_card": destination}
	if err := txn.Load(q); err != nil {
		app.Error("SAPC ConfirmTxn Load Error", err.Error())
		return err
	}
	txn.Flag = 1
	if err := txn.Save(); err != nil {
		app.Error("SAPC ConfirmTxn Save Error", err.Error())
		return err
	}
	return nil
}
