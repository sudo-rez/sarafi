package router

import (
	"errors"
	"payment/app"
	"payment/sepah"

	"github.com/labstack/echo/v4"
)

type (
	codeForm struct {
		Source      string `json:"source" form:"source" query:"source"`
		Destination string `json:"destination" form:"destination" query:"destination"`
		Amount      string `json:"amount" form:"amount" query:"amount"`
		ExYear      string `json:"exYear" form:"exYear" query:"exYear"`
		ExMonth     string `json:"exMonth" form:"exMonth" query:"exMonth"`
		Cvv2        string `json:"cvv2" form:"cvv2" query:"cvv2"`
	}
	verifyForm struct {
		codeForm
		TxID string `json:"txId" form:"txId" query:"txId"`
		Code string `json:"code" form:"code" query:"code"`
	}
)

func (f codeForm) DiscoverBank(source string) (string, error) {
	if len(source) != 16 {
		return "", errors.New("invalid card number")
	}
	return app.IranBanks[source[:6]][1], nil
}

func (f codeForm) Sepah(c echo.Context) error {
	form := sepah.CreateTxnForm{
		Username:         app.Cfg.Sepah.Username,
		Password:         app.Cfg.Sepah.Password,
		Amount:           f.Amount,
		InputCardNumber:  f.Source,
		OutputCardNumber: f.Destination,
		ExYear:           f.ExYear,
		ExMonth:          f.ExMonth,
		Cvv2:             f.Cvv2,
	}
	code, body, err := form.Send()
	if err != nil {
		app.Error("error in sending request", err.Error())
		return c.JSON(code, echo.Map{"error": err.Error()})
	}
	return c.JSONBlob(code, body)
}
func (f verifyForm) SepahVerify(c echo.Context) error {
	form := sepah.ConfirmTxnForm{
		TxID: f.TxID,
		Code: f.Code,
	}
	code, body, err := form.Send()
	if err != nil {
		app.Error("error in sending request", err.Error())
		return c.JSON(code, echo.Map{"error": err.Error()})
	}
	return c.JSONBlob(code, body)
}
