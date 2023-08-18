package sapc

import (
	"backend/app"
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type (
	Transaction struct {
		ID                int    `json:"id" bson:"id"`
		TransactionAmount string `json:"transactionAmount" bson:"transactionAmount"`
		BalanceAmount     string `json:"balanceAmount" bson:"balanceAmount"`
		Description       string `json:"description" bson:"description"`
		TransactionType   int    `json:"transactionType" bson:"transactionType"`
		ActionType        int    `json:"actionType" bson:"actionType"`
		DateMill          int64  `json:"dateMill" bson:"dateMill"`
		Username          string `json:"username" bson:"username"`
		UserID            string `json:"userId" bson:"userId"`
		DisplayName       string `json:"displayName" bson:"displayName"`
		NationalCode      string `json:"nationalCode" bson:"nationalCode"`
		AccountNumber     string `json:"account_number" bson:"account_number"`
		Flag              int    `json:"flag" bson:"flag"`
		Source            string `json:"source" bson:"source"`
		Destination       string `json:"destination" bson:"destination"`
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
func GetLastID() (int, error) {
	var txn Transaction
	err := app.MDB.CollectionString(txnCollectioName).FindOne(context.Background(), bson.M{}, options.FindOne().SetSort(bson.M{"id": -1})).Decode(&txn)
	if err != nil {
		return 0, err
	}
	return txn.ID, nil
}

func UpdateTxns() {
	token, err := Login(app.Cfg.SAPC.Username, app.Cfg.SAPC.Password)
	if err != nil {
		app.Error("SAPC Login failed: " + err.Error())
		return
	}
	lastID, err := GetLastID()
	if err != nil {
		app.Error("SAPC GetLastID failed: " + err.Error())
		lastID = -1
	}
	page := 1
	limit := 100
	for {
		txns, err := Transactions(token, page, limit)
		if err != nil {
			app.Error("SAPC Transactions failed: " + err.Error())
			return
		}
		if len(txns) == 0 {
			break
		}
		for _, txn := range txns {
			if txn.ID > lastID {
				if err := txn.Save(); err != nil {
					app.Error("SAPC Transaction Save failed: " + err.Error())
				}
			}
		}
		page++
	}
}
