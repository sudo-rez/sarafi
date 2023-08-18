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

	Account struct {
		Username string `json:"username"`
		Password string `json:"password"`
		UserID   string `json:"userId"`
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
		app.Debug(string(body))
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

func UpdateTransaction(token string, id int, flag bool) error {
	req := request.HTTPRequest{
		Name:   "SAPC Update Transaction",
		URL:    app.Cfg.SAPC.URL + fmt.Sprintf("/transactions/update?id=%d&flag=%t", id, flag),
		Method: http.MethodPut,
		Body: map[string]bool{
			"flag": flag,
		},
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"accept":        "application/json",
			"Authorization": "Bearer " + token,
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
	if err := UpdateTransaction(accessToken, transactions[0].ID, true); err != nil {
		app.Error("SAPC UpdateTransaction Error", err.Error())
		return err
	}
	return nil
}

func SetBankAccount(username, password string) error {
	token, err := Login(username, password)
	if err != nil {
		return err
	}
	req := request.HTTPRequest{
		Name:   "SAPC Set Bank Account",
		URL:    app.Cfg.SAPC.URL + "/account/setBankAccount",
		Method: http.MethodPost,
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"accept":        "application/json",
			"Authorization": "Bearer " + token,
		},
		Body: map[string]string{
			"username": username,
			"password": password,
		},
	}
	_, _, err = req.Send()
	if err != nil {
		return err
	}
	return nil
}

func SetAccountNumber(number, token string) error {
	req := request.HTTPRequest{
		Name:   "SAPC Set Account Number",
		URL:    app.Cfg.SAPC.URL + "/account/accountNumber",
		Method: http.MethodPost,
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"accept":        "application/json",
			"Authorization": "Bearer " + token,
		},
		Body: map[string]string{
			"number": number,
		},
	}
	_, _, err := req.Send()
	if err != nil {
		return err
	}
	return nil
}

func GetAccountNumbers(token string) ([]string, error) {
	req := request.HTTPRequest{
		Name:   "SAPC Get Account Numbers",
		URL:    app.Cfg.SAPC.URL + "/account/accountNumbers",
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
	var accountNumbers []string
	err = json.Unmarshal(body, &accountNumbers)
	if err != nil {
		return nil, err
	}
	return accountNumbers, nil
}
func GetCurrentUserID(token string) (Account, error) {
	req := request.HTTPRequest{
		Name:   "SAPC Get Current User ID",
		URL:    app.Cfg.SAPC.URL + "/account/currentUserId",
		Method: http.MethodGet,
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"accept":        "application/json",
			"Authorization": "Bearer " + token,
		},
	}
	_, body, err := req.Send()
	if err != nil {
		return Account{}, err
	}
	var account []Account
	err = json.Unmarshal(body, &account)
	if err != nil {
		return Account{}, err
	}
	if len(account) == 0 {
		return Account{}, errors.New("account not found")
	}
	return account[0], nil
}
