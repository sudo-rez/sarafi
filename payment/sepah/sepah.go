package sepah

import (
	"payment/app"
	"payment/request"
)

type (
	CreateTxnForm struct {
		Username         string `json:"username"`
		Password         string `json:"password"`
		Amount           string `json:"amount"`
		InputCardNumber  string `json:"inputCardNumber"`
		OutputCardNumber string `json:"outputCardNumber"`
		ExYear           string `json:"exYear"`
		ExMonth          string `json:"exMonth"`
		Cvv2             string `json:"cvv2"`
	}
	ConfirmTxnForm struct {
		TxID string `json:"txId"`
		Code string `json:"code"`
	}
)

func GetBalance() (int, []byte, error) {
	req := request.HTTPRequest{
		Name:   "SepahGetBalance",
		Method: "GET",
		URL:    app.Cfg.Sepah.BaseURL + "/sepah/balance?" + app.Cfg.Sepah.Username + "&" + app.Cfg.Sepah.Password,
		Headers: map[string]string{
			"accept": "application/json",
		},
	}
	return req.Send()
}

func (t CreateTxnForm) Send() (int, []byte, error) {
	req := request.HTTPRequest{
		Name:   "SepahCreateTransaction",
		Method: "POST",
		URL:    app.Cfg.Sepah.BaseURL + "/sepah/transaction/create",
		Headers: map[string]string{
			"accept":       "application/json",
			"Content-Type": "application/json",
		},
		Body: t,
	}
	return req.Send()
}

func (t ConfirmTxnForm) Send() (int, []byte, error) {
	req := request.HTTPRequest{
		Name:   "SepahConfirmTransaction",
		Method: "POST",
		URL:    app.Cfg.Sepah.BaseURL + "/sepah/transaction/confirm",
		Headers: map[string]string{
			"accept":       "application/json",
			"Content-Type": "application/json",
		},
		Body: t,
	}
	return req.Send()
}
