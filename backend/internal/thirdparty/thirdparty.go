package thirdparty

import (
	"backend/internal/request"
	"encoding/json"
	"errors"
)

type (
	ThirdParty struct {
		URL string `json:"url"`
	}
)

var (
	TP = ThirdParty{
		URL: "https://pvaq.xyz",
	}
)

func (s ThirdParty) SiteCardList() (SiteCardReponse, int, error) {
	var siteCards SiteCardReponse
	status, err := request.HTTPRequest{
		Name:   "Sapc-SiteCardList",
		Method: "GET",
		URL:    s.URL + "/api/siteCardList",
		Headers: map[string]string{
			"Cookie":       "PHPSESSID=vht2k01d2c1ifeid6noh5ta9pe",
			"Content-Type": "application/json",
		},
	}.SendAndDecode(&siteCards)
	return siteCards, status, err
}

func (t ThirdParty) PSPList() (PSPListResponse, int, error) {
	var pspList PSPListResponse
	status, err := request.HTTPRequest{
		Name:   "Sapc-PSPList",
		Method: "GET",
		URL:    t.URL + "/api/pspList",
	}.SendAndDecode(&pspList)
	return pspList, status, err
}

func (t ThirdParty) AddSiteCard(form SiteCard) (int, SiteCardReponse, error) {
	var siteCards SiteCardReponse
	statts, err := request.HTTPRequest{
		Name:   "Sapc-AddSiteCard",
		Method: "POST",
		URL:    t.URL + "/api/addSiteCard",
		Body:   form,
	}.SendAndDecode(&siteCards)
	return statts, siteCards, err
}

func (t ThirdParty) SiteCardRemove(ID int) (int, []byte, error) {
	return request.HTTPRequest{
		Name:   "Sapc-SiteCardRemove",
		Method: "POST",
		URL:    t.URL + "/api/siteCardRemove",
		Headers: map[string]string{
			"Cookie":       "PHPSESSID=vht2k01d2c1ifeid6noh5ta9pe",
			"Content-Type": "application/json",
		},
		Body: map[string]int{"id": ID},
	}.Send()
}

func (t ThirdParty) SiteCardChangeActive(ID int) (int, []byte, error) {
	return request.HTTPRequest{
		Name:   "Sapc-SiteCardChangeActive",
		Method: "POST",
		URL:    t.URL + "/api/siteCardChangeActive",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: map[string]int{"id": ID},
	}.Send()
}

func (t ThirdParty) CheckAccountExist(form CheckAccountExistForm) (ChackAccountExistResponse, error) {
	var checkAccountExistResponse ChackAccountExistResponse
	_, err := request.HTTPRequest{
		Name:   "Sapc-CheckAccountExist",
		Method: "POST",
		URL:    t.URL + "/middleApi/checkAccountExist",
		Body:   form,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.SendAndDecode(&checkAccountExistResponse)
	return checkAccountExistResponse, err
}

func (t ThirdParty) VerifyAccount(form VerfiyAccountForm) (VerfiyAccountFormReponse, error) {
	var verfiyAccountFormReponse VerfiyAccountFormReponse
	_, err := request.HTTPRequest{
		Name:   "Sapc-VerifyAccount",
		Method: "POST",
		URL:    t.URL + "/middleApi/verifyAccount",
		Body:   form,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.SendAndDecode(&verfiyAccountFormReponse)
	return verfiyAccountFormReponse, err
}

func (t ThirdParty) ShaparakSendSms(form ShaparakSendSmsForm) (ShaparakSendSmsResponse, error) {
	var shaparakSendSmsResponse ShaparakSendSmsResponse
	_, err := request.HTTPRequest{
		Name:   "Sapc-ShaparakSendSms",
		Method: "POST",
		URL:    t.URL + "/middleApi/shaparakSendSms",
		Body:   form,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.SendAndDecode(&shaparakSendSmsResponse)
	return shaparakSendSmsResponse, err
}

func (t ThirdParty) ShaparakAddCard(form ShaparakAddCardForm) ([]byte, error) {
	_, body, err := request.HTTPRequest{
		Name:   "Sapc-ShaparakAddCard",
		Method: "POST",
		URL:    t.URL + "/middleApi/shaparakAddCard",
		Body:   form,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.Send()
	return body, err
}

func (t ThirdParty) PayOTPRequest(form PayOTPRequestForm) (PayOTPRequestResponse, error) {
	var payOTPRequestResponse PayOTPRequestResponse
	_, err := request.HTTPRequest{
		Name:   "Sapc-PayOTPRequest",
		Method: "POST",
		URL:    t.URL + "/middleApi/payOtpRequest",
		Body:   form,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.SendAndDecode(&payOTPRequestResponse)
	return payOTPRequestResponse, err
}

func (t ThirdParty) DirectPay(form DirectPayForm) (DirectPayResponse, error) {
	var directPayResponse DirectPayResponse
	_, err := request.HTTPRequest{
		Name:   "Sapc-DirectPay",
		Method: "POST",
		URL:    t.URL + "/middleApi/directPay",
		Body:   form,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.SendAndDecode(&directPayResponse)
	return directPayResponse, err
}

func (t ThirdParty) CardTransaction(srcCard string) (CardTransactionResponse, int, error) {
	var cardTransactionResponse CardTransactionResponse
	status, err := request.HTTPRequest{
		Name:   "Sapc-CardTransaction",
		Method: "POST",
		URL:    t.URL + "/middleApi/cardTransaction",
		Body:   map[string]string{"src_card": srcCard},
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.SendAndDecode(&cardTransactionResponse)
	return cardTransactionResponse, status, err
}

func (t ThirdParty) DetectPSP() ([]byte, error) {
	_, body, err := request.HTTPRequest{
		Name:   "Sapc-CardDetectPSP",
		Method: "GET",
		URL:    t.URL + "/middleApi/detectPsp",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}.Send()
	return body, err
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
