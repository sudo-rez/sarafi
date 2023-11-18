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

func (t ThirdParty) AddSiteCard(form SiteCard) (int, []byte, error) {
	return request.HTTPRequest{
		Name:   "Sapc-AddSiteCard",
		Method: "POST",
		URL:    t.URL + "/api/addSiteCard",
		Body:   form,
	}.Send()
}

func (t ThirdParty) SiteCardRemove(ID int) (int, []byte, error) {
	return request.HTTPRequest{
		Name:   "Sapc-SiteCardRemove",
		Method: "POST",
		URL:    t.URL + "/api/siteCardRemove",
		Body:   map[string]int{"id": ID},
	}.Send()
}

func (t ThirdParty) SiteCardChangeActive(ID int) (int, []byte, error) {
	return request.HTTPRequest{
		Name:   "Sapc-SiteCardChangeActive",
		Method: "POST",
		URL:    t.URL + "/api/siteCardChangeActive",
		Body:   map[string]int{"id": ID},
	}.Send()
}

func (t ThirdParty) CheckAccountExist(form CheckAccountExistForm) (ChackAccountExistResponse, error) {
	var checkAccountExistResponse ChackAccountExistResponse
	_, err := request.HTTPRequest{
		Name:   "Sapc-CheckAccountExist",
		Method: "POST",
		URL:    t.URL + "/api/checkAccountExist",
		Body:   form,
	}.SendAndDecode(&checkAccountExistResponse)
	return checkAccountExistResponse, err
}

func (t ThirdParty) VerifyAccount(form VerfiyAccountForm) ([]byte, error) {
	_, body, err := request.HTTPRequest{
		Name:   "Sapc-VerifyAccount",
		Method: "POST",
		URL:    t.URL + "/api/verifyAccount",
		Body:   form,
	}.Send()
	return body, err
}

func (t ThirdParty) ShaparakSendSms(form ShaparakSendSmsForm) ([]byte, error) {
	_, body, err := request.HTTPRequest{
		Name:   "Sapc-ShaparakSendSms",
		Method: "POST",
		URL:    t.URL + "/api/shaparakSendSms",
		Body:   form,
	}.Send()
	return body, err
}

func (t ThirdParty) ShaparakAddCard(form ShaparakAddCardForm) ([]byte, error) {
	_, body, err := request.HTTPRequest{
		Name:   "Sapc-ShaparakAddCard",
		Method: "POST",
		URL:    t.URL + "/api/shaparakAddCard",
		Body:   form,
	}.Send()
	return body, err
}

func (t ThirdParty) PayOTPRequest(form PayOTPRequestForm) ([]byte, error) {
	_, body, err := request.HTTPRequest{
		Name:   "Sapc-PayOTPRequest",
		Method: "POST",
		URL:    t.URL + "/api/payOTPRequest",
		Body:   form,
	}.Send()
	return body, err
}

func (t ThirdParty) DirectPay(form DirectPayForm) (DirectPayResponse, error) {
	var directPayResponse DirectPayResponse
	_, err := request.HTTPRequest{
		Name:   "Sapc-DirectPay",
		Method: "POST",
		URL:    t.URL + "/api/directPay",
		Body:   form,
	}.SendAndDecode(&directPayResponse)
	return directPayResponse, err
}

func (t ThirdParty) CardTransaction(srcCard string) (CardTransactionResponse, int, error) {
	var cardTransactionResponse CardTransactionResponse
	status, err := request.HTTPRequest{
		Name:   "Sapc-CardTransaction",
		Method: "POST",
		URL:    t.URL + "/api/cardTransaction",
		Body:   map[string]string{"src_card": srcCard},
	}.SendAndDecode(&cardTransactionResponse)
	return cardTransactionResponse, status, err
}

func (t ThirdParty) DetectPSP() ([]byte, error) {
	_, body, err := request.HTTPRequest{
		Name:   "Sapc-CardDetectPSP",
		Method: "GET",
		URL:    t.URL + "/api/detectPsp",
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
