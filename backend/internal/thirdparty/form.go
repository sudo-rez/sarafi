package thirdparty

type (
	SiteCard struct {
		ID        string `json:"id"`
		Owner     string `json:"owner"`
		CardNo    string `json:"card_no"`
		ShebaNo   string `json:"sheba_no"`
		AccountNo string `json:"account_no"`
		Username  string `json:"username"`
		Pass      string `json:"pass"`
		PSP       string `json:"psp"`
		Active    string `json:"active"`
	}
	SiteCardReponse struct {
		Code    int        `json:"code"`
		Message string     `json:"message"`
		Item    []SiteCard `json:"item"`
	}
	PSPListResponse struct {
		Code int   `json:"code"`
		Item []PSP `json:"item"`
	}
	PSP struct {
		ID    string `json:"id"`
		PSP   string `json:"psp"`
		Title string `json:"title"`
	}
	CheckAccountExistForm struct {
		SrcCard string `json:"src_card"`
		Amount  string `json:"amount"`
		Mobile  string `json:"mobile"`
		PSP     string `json:"psp"`
	}
	ChackAccountExistResponse struct {
		Code          int    `json:"code"`
		Message       string `json:"message"`
		TransactionID string `json:"transaction_id"`
	}
	VerfiyAccountForm struct {
		Mobile        string `json:"mobile"`
		VerifyCode    string `json:"verify_code"`
		TransactionID string `json:"transaction_id"`
	}
	VerfiyAccountFormReponse struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	}
	ShaparakSendSmsForm struct {
		SrcCard       string `json:"src_card"`
		Mobile        string `json:"mobile"`
		TransactionID string `json:"transaction_id"`
	}
	ShaparakSendSmsResponse struct {
		Code          int    `json:"code"`
		Message       string `json:"message"`
		TransactionID string `json:"transaction_id"`
	}
	ShaparakAddCardForm struct {
		SrcCard       string `json:"src_card"`
		Expair        string `json:"expair"`
		Cvv2          string `json:"cvv2"`
		OTP           string `json:"otp"`
		TransactionID string `json:"transaction_id"`
	}
	PayOTPRequestForm struct {
		SrcCard       string `json:"src_card"`
		DesCard       string `json:"des_card"`
		Amount        string `json:"amount"`
		Expair        string `json:"expair"`
		Cvv2          string `json:"cvv2"`
		Mobile        string `json:"mobile"`
		TransactionID string `json:"transaction_id"`
	}
	PayOTPRequestResponse struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	}
	DirectPayForm struct {
		SrcCard       string `json:"src_card"`
		DesCard       string `json:"des_card"`
		Pin2          string `json:"pin2"`
		Amount        string `json:"amount"`
		Expair        string `json:"expair"`
		Cvv2          string `json:"cvv2"`
		Mobile        string `json:"mobile"`
		TransactionID string `json:"transaction_id"`
	}
	DirectPayResponse struct {
		Code            int    `json:"code"`
		Message         string `json:"message"`
		ReferenceNumber string `json:"reference_number"`
	}

	CardTransaction struct {
		SrcCard      string `json:"src_card"`
		DesCard      string `json:"des_card"`
		Amount       string `json:"amount"`
		TrackingCode string `json:"tracking_code"`
		Status       string `json:"status"`
		Created      string `json:"created"`
	}
	CardTransactionResponse struct {
		Code int               `json:"code"`
		Item []CardTransaction `json:"item"`
	}
	CardData struct {
		Owner string `json:"owner"`
		Bank  string `json:"bank"`
	}
	CardResponse struct {
		Code int      `json:"code"`
		Data CardData `json:"data"`
		Msg  string   `json:"msg"`
	}
)
