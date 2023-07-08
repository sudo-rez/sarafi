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
	ec.GET("/captcha/*", captchaHandler)
	ec.POST("/otp", otp)
	ec.POST("/card/otp", cardOtp)
	ec.POST("/card/verify", cardOtpVerify)
	ec.POST("/t", doTransaction)
	ec.Any("/callbacktest", testCallBack)
}

type (
	Form struct {
		Pan        string `json:"pan" form:"pan"`
		Mobile     string `json:"mobile" form:"mobile"`
		PaymentID  string `json:"p" form:"p"`
		NationalID string `json:"national_id" form:"national_id"`
		BirthDay   string `json:"birthday" form:"birthday"`
		VerifyCode string `json:"verify_code" form:"verify_code"`
	}
	TxnForm struct {
		PaymentID string `json:"p" form:"p"`
		Pan       string `json:"pan" form:"pan"`
		Pin       string `json:"pin" form:"pin"`
		Cvv2      string `json:"cvv2" form:"cvv2"`
		EMonth    string `json:"e_month" form:"e_month"`
		EYear     string `json:"e_year" form:"e_year"`
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
	return c.Render(http.StatusOK, "index.html", echo.Map{
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
	txnTemp := thirdparty.TransactionTemplate{
		Source:      form.Pan,
		Destination: t.Destination,
		Pin:         form.Pin,
		Amount:      fmt.Sprint(t.Amount),
		ExpireMonth: form.EMonth,
		ExpireYear:  form.EYear,
		Cvv2:        form.Cvv2,
		PaymentID:   t.Info.PaymentID,
	}
	res, err := txnTemp.Payment()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": tryLaterError})
	}
	t.Source = txnTemp.Source
	t.ResponseCode = res.Code

	if res.Code == 0 {
		if siteref, ok := res.Data["site_ref"]; ok {
			t.SiteRef = fmt.Sprint(siteref)
		}
		if bankref, ok := res.Data["bankReference"]; ok {
			t.CheckoutRef = fmt.Sprint(bankref)
		}
		t.Done = true
		t.Message = "OK"
		t.Successful = true
	} else {
		t.Message = res.Msg
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
func otp(c echo.Context) error {
	form := new(Form)
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
	body, err := thirdparty.OtpRequest(form.Pan, fmt.Sprint(t.Amount), form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	return c.Blob(http.StatusOK, "application/json", body)
}
func cardOtp(c echo.Context) error {
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
	body, code, err := thirdparty.CardOtp(form.Pan, form.Mobile, form.PaymentID, form.NationalID, form.BirthDay)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	if body.Code == 1 {
		p := account.Pan{
			Card:       form.Pan,
			Mobile:     form.Mobile,
			NationalID: form.NationalID,
			Birthday:   form.BirthDay,
		}
		if err := p.AddNewPan(t.Account, t.Brand); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
		}

	}
	return c.JSON(code, body)
}
func cardOtpVerify(c echo.Context) error {
	form := new(Form)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Pan == "" || form.Mobile == "" || !primitive.IsValidObjectID(form.PaymentID) || form.VerifyCode == "" {
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
	body, err := thirdparty.CardOtpVerify(form.Pan, form.Mobile, form.PaymentID, form.VerifyCode)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	if body.Code == 0 {
		p := account.Pan{
			Card:       form.Pan,
			Mobile:     form.Mobile,
			NationalID: form.NationalID,
			Birthday:   form.BirthDay,
		}
		if err := p.AddNewPan(t.Account, t.Brand); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
		}
	}
	return c.JSON(http.StatusOK, body)
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
