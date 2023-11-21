package web

import (
	"backend/app"
	"backend/internal/account"
	"backend/internal/brand"
	"backend/internal/thirdparty"
	"backend/internal/txn"
	"backend/internal/wallet"
	"backend/pkg/jwtpayload"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/dchest/captcha"
	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/random"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func Routes(ec *echo.Echo) {
	ec.POST("/gateway", gatewayWithToken)
	ec.POST("/withdraw", withdraw)
	ec.POST("/withdraw/status", withdrawStatus)
	ec.POST("/withdraw/cancel", withdrawCancel)
	ec.POST("/transaction", transactionStatus)
	ec.GET("/cancel", cancelTransaction)
	ec.GET("/success", successTransaction)
	ec.GET("", index).Name = "index"
	// ec.GET("/captcha/*", captchaHandler)
	// ec.Any("/callbacktest", testCallBack)

	// apc
	ec.GET("/apc", apc)
	ec.POST("/otp", payOtp)
	ec.POST("/card/check", checkAccountExist)
	ec.POST("/card/check/verify", checkVerify)
	ec.POST("/card/shaparak/otp", shaparakSendSms)
	ec.POST("/card/shaparak/verify", shaparakAddCard)
	ec.POST("/t", doTransaction)

	// sapc
	ec.GET("/sapc", sapcIndex)
	ec.POST("/sapc/addcard", sapcAddCard)
	ec.POST("/sapc/confirm", sapcConfirm)
}

type (
	Form struct {
		Pan       string `json:"pan" form:"pan"`
		Mobile    string `json:"mobile" form:"mobile"`
		PaymentID string `json:"p" form:"p"`
		EMonth    string `json:"e_month" form:"e_month"`
		EYear     string `json:"e_year" form:"e_year"`
		Cvv2      string `json:"cvv2" form:"cvv2"`
		Otp       string `json:"otp" form:"otp"`
	}
	TxnForm struct {
		PaymentID string `json:"p" form:"p"`
		Pan       string `json:"pan" form:"pan"`
		Pin       string `json:"pin" form:"pin"`
		Cvv2      string `json:"cvv2" form:"cvv2"`
		EMonth    string `json:"e_month" form:"e_month"`
		EYear     string `json:"e_year" form:"e_year"`
		Mobile    string `json:"mobile" form:"mobile"`
	}
)

func gatewayWithToken(c echo.Context) error {
	info, b, err := jwtpayload.GetInfoFromToken(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	if info.Amount == "" || info.CallBackUrl == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": "invalid input"})
	}
	amount, err := strconv.ParseInt(app.ToEnglishDigits(info.Amount), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": "error in amount , error = " + err.Error()})
	}
	t := txn.Txn{
		Amount:     txn.AmountFromCurrency(amount, info.Currency),
		Account:    info.StringAccount(),
		Brand:      b.ID,
		BrandName:  b.Name,
		ClientIP:   info.ClientIP,
		PaymentID:  info.PaymentID,
		CancelCode: random.String(6),
		CallBack: txn.Callback{
			URL:         info.CallBackUrl,
			FailURL:     info.FailUrl,
			SuccessURL:  info.SuccessUrl,
			RedirectURL: info.SiteUrl,
			Method:      info.CallBackMethod,
		},
		Info: *info,
	}

	if err := t.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"code": "500", "error": err.Error()})
	}
	if c.QueryParam("r") == "true" {
		return c.Redirect(http.StatusFound, fmt.Sprint("/?p=", t.ID.Hex()))
	}
	return c.JSON(http.StatusOK, echo.Map{"url": app.Cfg.Domain + fmt.Sprint("/?p=", t.ID.Hex())})
}

func index(c echo.Context) error {
	objID, err := primitive.ObjectIDFromHex(c.QueryParam("p"))
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}

	account, err := account.LoadOrCreateAccount(t.Account, t.Brand)
	if err != nil {
		return c.Render(http.StatusInternalServerError, "badrequest.html", echo.Map{"code": "500", "error": err.Error()})
	}

	if err != nil {
		return c.Render(http.StatusInternalServerError, "badrequest.html", echo.Map{"code": "500", "error": err.Error()})
	}
	timeRemain := time.Duration(app.Stg.GateWay.OpenTime)*time.Minute - time.Since(t.CreatedAt)
	if timeRemain < 0 || t.Done {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": "time finished or transaction is done"})
	}
	// if !account.SAPCActive {
	// 	return c.Redirect(http.StatusFound, fmt.Sprint("/apc?p=", t.ID.Hex()))
	// }
	return c.Render(http.StatusOK, "index.html", echo.Map{
		"title":       "صفحه پرداخت",
		"setting":     app.Stg.Rest(),
		"account":     account,
		"cancel":      t.CancelCode,
		"amount":      t.Amount,
		"time_remain": timeRemain.Milliseconds(),
		"payment_id":  t.ID.Hex(),
	})
}
func apc(c echo.Context) error {
	// return c.Redirect(http.StatusFound, fmt.Sprint("/?p=", c.QueryParam("p")))
	objID, err := primitive.ObjectIDFromHex(c.QueryParam("p"))
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}

	account, err := account.LoadOrCreateAccount(t.Account, t.Brand)
	if err != nil {
		return c.Render(http.StatusInternalServerError, "badrequest.html", echo.Map{"code": "500", "error": err.Error()})
	}

	if err != nil {
		return c.Render(http.StatusInternalServerError, "badrequest.html", echo.Map{"code": "500", "error": err.Error()})
	}
	timeRemain := time.Duration(app.Stg.GateWay.OpenTime)*time.Minute - time.Since(t.CreatedAt)
	if timeRemain < 0 || t.Done {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": "time finished or transaction is done"})
	}
	return c.Render(http.StatusOK, "apc.html", echo.Map{
		"title":       "صفحه پرداخت",
		"captchaId":   captcha.New(),
		"setting":     app.Stg.Rest(),
		"account":     account,
		"cancel":      t.CancelCode,
		"amount":      t.Amount,
		"time_remain": timeRemain.Milliseconds(),
	})
}

func withdraw(c echo.Context) error {
	info, b, err := jwtpayload.GetInfoFromToken(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	if info.Amount == "" || info.Pan == "" || info.CallBackUrl == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": "invalid input"})
	}
	if !app.IsValidCard(info.Pan) {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": "destination pan is invalid"})
	}
	amount, err := strconv.ParseInt(app.ToEnglishDigits(info.Amount), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": "error in amount , error = " + err.Error()})
	}
	w := txn.Withdraw{
		Amount:  txn.AmountFromCurrency(int64(amount), info.Currency),
		Card:    info.Pan,
		Brand:   b.ID,
		Account: fmt.Sprint(info.Account),
		Callback: txn.Callback{
			URL:         info.CallBackUrl,
			FailURL:     info.FailUrl,
			SuccessURL:  info.SuccessUrl,
			RedirectURL: info.SiteUrl,
			Method:      info.CallBackMethod,
		},
		Info: *info,
	}
	if err := w.Create(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"code": "500", "error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"withdraw_id": w.ID})
}
func withdrawCancel(c echo.Context) error {
	info, _, err := jwtpayload.GetInfoFromToken(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	objID, err := primitive.ObjectIDFromHex(info.ID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	w, err := txn.LoadWD(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"code": "500", "error": err.Error()})
	}
	w.Done = true
	w.InProgress = false
	w.Canceled = true
	w.Remaining = 0
	if err := w.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"code": "500", "error": err.Error()})
	}
	return c.JSON(http.StatusOK, w.RestGateWay())
}
func withdrawStatus(c echo.Context) error {
	info, _, err := jwtpayload.GetInfoFromToken(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	objID, err := primitive.ObjectIDFromHex(info.ID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	w, err := txn.LoadWD(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"code": "500", "error": err.Error()})
	}
	return c.JSON(http.StatusOK, w.RestGateWay())
}
func transactionStatus(c echo.Context) error {
	info, _, err := jwtpayload.GetInfoFromToken(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	objID, err := primitive.ObjectIDFromHex(info.ID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"code": "400", "error": err.Error()})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"code": "500", "error": err.Error()})
	}
	return c.JSON(http.StatusOK, t.RestGateWay())
}

func captchaHandler(c echo.Context) error {
	captcha.Server(captcha.StdWidth, captcha.StdHeight).ServeHTTP(c.Response(), c.Request())
	return nil
}

func doTransaction(c echo.Context) error {
	form := new(TxnForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": gateWayInputError, "error": err.Error()})
	}
	if form.Pan == "" || !primitive.IsValidObjectID(form.PaymentID) || form.Cvv2 == "" || form.EMonth == "" || form.EYear == "" || form.Pin == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": gateWayInputError})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusOK, echo.Map{"msg": wrongPanError})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": gateWayInputError})
	}
	t, err := txn.Load(bson.M{"_id": objID, "done": false})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": gateWayInputError})
	}

	txnTemp := thirdparty.DirectPayForm{
		SrcCard:       form.Pan,
		DesCard:       t.Destination,
		Pin2:          form.Pin,
		Cvv2:          form.Cvv2,
		Amount:        fmt.Sprint(t.Amount),
		Expair:        form.EYear + form.EMonth,
		Mobile:        form.Mobile,
		TransactionID: t.TransactionID,
	}
	res, err := thirdparty.TP.DirectPay(txnTemp)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": tryLaterError})
	}
	t.Source = txnTemp.SrcCard
	t.ResponseCode = res.Code

	if res.Code == 0 {
		t.SiteRef = res.ReferenceNumber
		t.CheckoutRef = res.ReferenceNumber
		t.Done = true
		t.Message = "OK"
		t.Successful = true
	} else {
		t.Message = res.Message
	}

	if err := t.Save(); err != nil {
		app.Error("Error in Saving Txn After Calling API", err.Error())
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"msg": fmt.Sprint(unknownTxnError, t.ID.Hex())})
	}
	if err := t.UpdateWithDraw(); err != nil {
		app.Error("Error in Updating Withdraw After Calling API", err.Error())
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"msg": fmt.Sprint(unknownTxnError, t.ID.Hex())})
	}
	if t.Done {
		go func() {
			if err := wallet.TxnFeeDeduction(t.Brand, t.FeeDeduction(brand.ReadWage(t.Brand))); err != nil {
				app.Error("Error in Deducting Fee , brand =", t.Brand, " Error = ", err.Error())
			}
			if err := t.SendCallBack(); err != nil {
				for i := 0; i < 5; i++ {
					if err := t.SendCallBack(); err == nil {
						return
					}
				}
				app.Error("CallBackError", err.Error())
			} else {
				t.CallBack.Done = true
				t.Save()
			}
		}()

	}

	return c.JSON(http.StatusOK, echo.Map{"code": res.Code, "msg": t.Message})
}
func cancelTransaction(c echo.Context) error {
	objID, err := primitive.ObjectIDFromHex(c.QueryParam("id"))
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}
	t, err := txn.Load(bson.M{"_id": objID, "done": false})
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}
	if t.CancelCode != c.QueryParam("code") {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}
	t.Message = "canceled"
	t.Done = true
	t.Successful = false
	if err := t.Save(); err != nil {
		return c.Render(http.StatusInternalServerError, "badrequest.html", echo.Map{"code": "500", "error": err.Error()})
	}
	go func() {
		if err := t.SendCallBack(); err != nil {
			for i := 0; i < 5; i++ {
				if err := t.SendCallBack(); err == nil {
					return
				}
			}
			app.Error("CallBackError", err.Error())
		} else {
			t.CallBack.Done = true
			t.Save()
		}

	}()

	return c.Render(http.StatusPermanentRedirect, "msg.html", echo.Map{
		"code":     "200",
		"title":    "انصراف از تراکنش",
		"msg":      "پرداخت انجام نشد",
		"redirect": t.CallBack.RedirectURL,
	})
}
func successTransaction(c echo.Context) error {
	objID, err := primitive.ObjectIDFromHex(c.QueryParam("id"))
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.Render(http.StatusBadRequest, "badrequest.html", echo.Map{"code": "404", "error": err.Error()})
	}
	return c.Render(http.StatusPermanentRedirect, "msg.html", echo.Map{
		"code":     "200",
		"title":    "تراکنش موفق",
		"msg":      "تراکنش با موفقیت انجام شد",
		"redirect": t.CallBack.RedirectURL,
	})
}
func payOtp(c echo.Context) error {
	form := new(TxnForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Pan == "" || !primitive.IsValidObjectID(form.PaymentID) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusOK, echo.Map{"msg": "شماره کارت اشتباه میباشد"})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if t.Destination == "" {
		desQ := txn.GetFromQueue(t.Amount, t.BrandName)
		if desQ == nil {
			apc, err := brand.LoadAPCForPayment(t.Amount, t.Brand)
			if err != nil {
				app.Error("Load APC Error", err.Error())
				return c.JSON(http.StatusInternalServerError, echo.Map{"msg": gateWayDisabledError})
			}
			t.Destination = apc.CardNumber
		} else {
			t.Destination = desQ.Card
			t.WithdrawID = desQ.ID
		}
	}

	txnTemp := thirdparty.PayOTPRequestForm{
		SrcCard:       form.Pan,
		DesCard:       t.Destination,
		Amount:        fmt.Sprint(t.Amount),
		Expair:        form.EYear + form.EMonth,
		Cvv2:          form.Cvv2,
		Mobile:        form.Mobile,
		TransactionID: t.TransactionID,
	}

	body, err := thirdparty.TP.PayOTPRequest(txnTemp)
	if err != nil {
		go func() {
			if err := t.UpdateWithDrawOTP(); err != nil {
				app.Error("Update Withdraw Issue in OTP , ", err.Error())
			}
		}()
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید", "error": err.Error()})
	}
	if body.Code != 0 {
		if err := t.UpdateWithDrawOTP(); err != nil {
			app.Error("Update Withdraw Issue in OTP , ", err.Error())
		}
		return c.JSON(http.StatusOK, echo.Map{"msg": body.Message, "code": body.Code})
	} else {
		t.Source = txnTemp.SrcCard
	}

	go func() {
		time.Sleep(5 * time.Minute)
		updatedTxn, err := txn.Load(bson.M{"_id": objID})
		if err != nil {
			app.Error("Can not get Txn for update withdraw list after 5 min , err = ", err.Error())
		}
		if err := updatedTxn.UpdateWithDrawOTP(); err != nil {
			app.Error("Update Withdraw Issue in OTP2 , ", err.Error())
		}
	}()
	if err := t.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید", "error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"msg": body.Message, "code": body.Code})
}
func checkAccountExist(c echo.Context) error {
	form := new(Form)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Pan == "" || form.Mobile == "" || !primitive.IsValidObjectID(form.PaymentID) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "شماره کارت اشتباه میباشد"})
	}
	tmp := thirdparty.CheckAccountExistForm{
		SrcCard: form.Pan,
		Amount:  fmt.Sprint(t.Amount),
		Mobile:  form.Mobile,
		PSP:     "",
	}
	res, err := thirdparty.TP.CheckAccountExist(tmp)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	t.TransactionID = res.TransactionID
	if err := t.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"code": res.Code,
		"msg":  res.Message,
	})
}
func checkVerify(c echo.Context) error {
	form := new(Form)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Mobile == "" || !primitive.IsValidObjectID(form.PaymentID) || form.Otp == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "شماره کارت اشتباه میباشد"})
	}
	tmp := thirdparty.VerfiyAccountForm{
		Mobile:        form.Mobile,
		VerifyCode:    form.Otp,
		TransactionID: t.TransactionID,
	}
	body, err := thirdparty.TP.VerifyAccount(tmp)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"code": body.Code,
		"msg":  body.Message,
	})
}
func shaparakSendSms(c echo.Context) error {
	form := new(Form)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Pan == "" || form.Mobile == "" || !primitive.IsValidObjectID(form.PaymentID) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "شماره کارت اشتباه میباشد"})
	}
	tmp := thirdparty.CheckAccountExistForm{
		SrcCard: form.Pan,
		Amount:  fmt.Sprint(t.Amount),
		Mobile:  form.Mobile,
		PSP:     "",
	}
	res, err := thirdparty.TP.CheckAccountExist(tmp)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	t.TransactionID = res.TransactionID
	if err := t.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	if res.Code == 0 {
		return c.JSON(http.StatusOK, res)
	}
	tmp2 := thirdparty.ShaparakSendSmsForm{
		SrcCard:       form.Pan,
		Mobile:        form.Mobile,
		TransactionID: t.TransactionID,
	}
	body, err := thirdparty.TP.ShaparakSendSms(tmp2)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"code": body.Code,
		"msg":  body.Message,
	})
}
func shaparakAddCard(c echo.Context) error {
	form := new(Form)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Pan == "" || form.Mobile == "" || !primitive.IsValidObjectID(form.PaymentID) || form.Otp == "" {
		return c.JSON(http.StatusOK, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusOK, echo.Map{"msg": "شماره کارت اشتباه میباشد"})
	}
	tmp := thirdparty.ShaparakAddCardForm{
		SrcCard:       form.Pan,
		Expair:        form.EYear + form.EMonth,
		Cvv2:          form.Cvv2,
		OTP:           form.Otp,
		TransactionID: t.TransactionID,
	}
	body, err := thirdparty.TP.ShaparakAddCard(tmp)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	p := account.Pan{
		Card:   form.Pan,
		Mobile: form.Mobile,
	}
	if err := p.AddNewPan(t.Account, t.Brand); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}

	return c.Blob(http.StatusOK, "application/json", body)
}
func testCallBack(c echo.Context) error {
	if !app.Cfg.Dev {
		return c.JSON(http.StatusOK, echo.Map{"msg": "Not Found"})
	}
	m := make(map[string]any)
	c.Bind(&m)
	app.Debug("Call Back Test Body", m)
	app.Debug("Call Back Test Params", c.QueryParams())
	return c.JSON(http.StatusOK, c.Request().Body)
}
