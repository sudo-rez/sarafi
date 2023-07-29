package sapc

import (
	"backend/app"
	"backend/internal/request"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
)

type (
	LoginResponse struct {
		AccessToken string `json:"accessToken"`
	}
	Transaction struct {
		ID                int    `json:"id"`
		TransactionAmount string `json:"transactionAmount"`
		BalanceAmount     string `json:"balanceAmount"`
		Description       string `json:"description"`
		TransactionType   int    `json:"transactionType"`
		ActionType        int    `json:"actionType"`
		DateMill          int64  `json:"dateMill"`
		Username          string `json:"username"`
		UserID            string `json:"userId"`
		DisplayName       string `json:"displayName"`
		NationalCode      string `json:"nationalCode"`
		Flag              int    `json:"flag"`
	}
)

func Login(username, password string) (string, error) {
	req := request.HTTPRequest{
		Name:   "SAPC Login",
		URL:    app.Cfg.SAPC.URL + "/auth/login",
		Method: http.MethodPost,
		Body: map[string]string{
			"username": username,
			"password": password,
		},
		Headers: map[string]string{
			"Content-Type": "application/json",
			"accept":       "application/json",
		},
	}
	_, body, err := req.Send()
	if err != nil {
		return "", err
	}
	var loginResponse LoginResponse
	err = json.Unmarshal(body, &loginResponse)
	if err != nil {
		return "", err
	}
	return loginResponse.AccessToken, nil
}

func Transactions(token string, page, limit int) ([]Transaction, error) {
	req := request.HTTPRequest{
		Name:   "SAPC Transactions",
		URL:    app.Cfg.SAPC.URL + fmt.Sprintf("/transactions?page=%d&limit=%d", page, limit),
		Method: http.MethodGet,
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"accept":        "application/json",
			"Authorization": "Bearer " + token,
		},
	}
	_, body, err := req.Send()
	if err != nil {
		return nil, err
	}
	var transactions []Transaction
	err = json.Unmarshal(body, &transactions)
	if err != nil {
		return nil, err
	}
	return transactions, nil
}

func SearchTransactions(token, cardNumber, amountTransaction string) ([]Transaction, error) {
	req := request.HTTPRequest{
		Name:   "SAPC Search Transactions",
		URL:    app.Cfg.SAPC.URL + fmt.Sprintf("/transactions/search?cardNumber=%s&amountTransaction=%s&isSpent=false&passHours=1000", cardNumber, amountTransaction),
		Method: http.MethodGet,
		Headers: map[string]string{
			"accept":        "application/json",
			"Authorization": "Bearer " + token,
		},
	}
	_, body, err := req.Send()
	if err != nil {
		return nil, err
	}
	app.Debug(string(body))
	var transactions []Transaction
	err = json.Unmarshal(body, &transactions)
	if err != nil {
		return nil, err
	}
	return transactions, nil

}

func UpdateTransaction(id int, flag bool) error {
	req := request.HTTPRequest{
		Name:   "SAPC Update Transaction",
		URL:    app.Cfg.SAPC.URL + fmt.Sprintf("/transactions/update?id=%d&flag", id),
		Method: http.MethodPut,
		Body: map[string]bool{
			"flag": flag,
		},
		Headers: map[string]string{
			"Content-Type": "application/json",
			"accept":       "application/json",
		},
	}
	_, _, err := req.Send()
	if err != nil {
		return err
	}
	return nil
}

func ConfirmTxn(username, password, pan, amount string) error {
	accessToken, err := Login(username, password)
	if err != nil {
		app.Error("SAPC Login Error", err.Error())
		return err
	}
	transactions, err := SearchTransactions(accessToken, pan, amount)
	if err != nil {
		app.Error("SAPC SearchTransactions Error", err.Error())
		return err
	}
	if len(transactions) == 0 {
		app.Error("SAPC SearchTransactions Error", "transaction not found")
		return errors.New("transaction not found")
	}
	if err := UpdateTransaction(transactions[0].ID, true); err != nil {
		app.Error("SAPC UpdateTransaction Error", err.Error())
		return err
	}
	return nil
}
