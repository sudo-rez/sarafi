package thirdparty

import (
	"encoding/json"
	"errors"
	"backend/app"
	"backend/internal/request"
)

type (
	TransactionTemplate struct {
		Source, Destination, Pin, Amount, ExpireMonth, ExpireYear, Cvv2, PaymentID string
	}
	ResponseTemplate struct {
		Code int                    `json:"code"`
		Msg  string                 `json:"msg"`
		Data map[string]interface{} `json:"data"`
	}
	CardResponse struct {
		Code int      `json:"code"`
		Data CardData `json:"data"`
		Msg  string   `json:"msg"`
	}
	CardData struct {
		Owner string `json:"owner"`
		Bank  string `json:"bank"`
	}
)

func OtpRequest(pan, amount, paymentID string) ([]byte, error) {
	req := request.HTTPRequest{
		Name:   "TxnOtpRequest",
		Method: "POST",
		URL:    "https://paybeast.xyz/otpRequest",
		Body: map[string]interface{}{
			"pan":        pan,
			"amount":     amount,
			"payment_id": paymentID,
		},
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
	_, body, err := req.Send()
	return body, err
}

func CardOtp(pan, mobile, paymentId string, nationalID, birthday string) (*ResponseTemplate, int, error) {
	if app.Cfg.Dev {
		return &ResponseTemplate{
			Code: 1,
			Msg:  "success",
			Data: map[string]interface{}{
				"status": "success",
			},
		}, 200, nil
	}
	req := request.HTTPRequest{
		Name:   "CardOtp",
		Method: "POST",
		URL:    "https://paybulk.xyz/accountStatus",
		Body: map[string]interface{}{
			"pan":         pan,
			"mobile":      mobile,
			"payment_id":  paymentId,
			"national_id": nationalID,
			"birthday":    birthday,
		},
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFwaURpcmVjdCIsImFkbWluIjp0cnVlLCJpYXQiOjk4NzY1MjYzMjJ9.YgBGb9MGuiJGwvtLLEXSD8098h0RYi7_6H6IekEMz5Rdo6506_N8Io5o8F94QUun6rkFhZXxs0Dc4cNJ_UWg7g",
		},
	}
	statusCode, body, err := req.Send()
	result := new(ResponseTemplate)
	if err := json.Unmarshal(body, result); err != nil {
		return nil, statusCode, err
	}
	return result, statusCode, err
}

func CardOtpVerify(pan, mobile, paymentId string, verifyCode string) (*ResponseTemplate, error) {
	req := request.HTTPRequest{
		Name:   "CardOtpVerify",
		Method: "POST",
		URL:    "https://paybulk.xyz/accountVerify",
		Body: map[string]interface{}{
			"pan":         pan,
			"mobile":      mobile,
			"payment_id":  paymentId,
			"verify_code": verifyCode,
		},
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFwaURpcmVjdCIsImFkbWluIjp0cnVlLCJpYXQiOjk4NzY1MjYzMjJ9.YgBGb9MGuiJGwvtLLEXSD8098h0RYi7_6H6IekEMz5Rdo6506_N8Io5o8F94QUun6rkFhZXxs0Dc4cNJ_UWg7g",
		},
	}

	_, body, err := req.Send()
	if err != nil {
		return nil, err
	}
	result := new(ResponseTemplate)
	if err := json.Unmarshal(body, result); err != nil {
		return nil, err
	}
	return result, nil
}

func (v TransactionTemplate) Payment() (*ResponseTemplate, error) {
	if app.Cfg.SuccessTest.Enable &&
		app.Cfg.SuccessTest.Pan == v.Source {
		if app.Cfg.SuccessTest.Cvv2 == v.Cvv2 &&
			app.Cfg.SuccessTest.ExpireMonth == v.ExpireMonth &&
			app.Cfg.SuccessTest.ExpireYear == v.ExpireYear &&
			app.Cfg.SuccessTest.Pin == v.Pin {
			return &ResponseTemplate{
				Code: 0,
				Msg:  "OK",
				Data: map[string]interface{}{
					"site_ref":      "1234567890",
					"bankReference": "1234567890",
				},
			}, nil
		}
		return &ResponseTemplate{
			Code: 1,
			Msg:  "OK",
			Data: map[string]interface{}{
				"site_ref":      "1234567890",
				"bankReference": "1234567890",
			},
		}, nil
	}
	if app.Cfg.Dev {
		return &ResponseTemplate{
			Code: 0,
			Msg:  "success",
			Data: map[string]interface{}{
				"payment_id": "1234567890",
				"status":     "success",
			},
		}, nil
	}
	req := request.HTTPRequest{
		Name:   "Payment",
		Method: "POST",
		URL:    "https://paybulk.xyz/payWithApi",
		Body: map[string]interface{}{
			"pan":          v.Source,
			"pin2":         v.Pin,
			"amount":       v.Amount,
			"expire_month": v.ExpireMonth,
			"expire_year":  v.ExpireYear,
			"cvv2":         v.Cvv2,
			"payment_id":   v.PaymentID,
			"pan_des":      v.Destination,
		},
		Headers: map[string]string{
			"Content-Type":  "application/json",
			"Authorization": "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFwaURpcmVjdCIsImFkbWluIjp0cnVlLCJpYXQiOjk4NzY1MjYzMjJ9.YgBGb9MGuiJGwvtLLEXSD8098h0RYi7_6H6IekEMz5Rdo6506_N8Io5o8F94QUun6rkFhZXxs0Dc4cNJ_UWg7g",
			"Cookie":        "PHPSESSID=qpufnfvrfiuoninnahblj61dfo",
		},
	}
	_, body, err := req.Send()
	if err != nil {
		return nil, err
	}
	result := new(ResponseTemplate)
	if err := json.Unmarshal(body, result); err != nil {
		return nil, err
	}
	return result, nil
}

func CardInfo(cardNumber string) (*CardData, error) {
	req := request.HTTPRequest{
		Name:   "CardInfo",
		Method: "POST",
		URL:    "https://paybulk.xyz/inquiryRequest",
		Body: map[string]interface{}{
			"pan": cardNumber,
		},
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}

	_, body, err := req.Send()
	if err != nil {
		return nil, err
	}
	info := new(CardResponse)
	if err := json.Unmarshal(body, info); err != nil {
		return nil, err
	}
	if info.Code != 0 {
		return nil, errors.New(info.Msg)
	}
	return &info.Data, nil
}
