package web

import (
	"backend/app"
	"backend/internal/account"
	"backend/internal/brand"
	"backend/internal/txn"
	"backend/sapc"
	"net/http"
	"strconv"
	"time"

	"github.com/dchest/captcha"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func sapcIndex(c echo.Context) error {
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
	sapc, err := brand.LoadSAPCForPayment(t.Amount, t.Brand)
	if err != nil {
		app.Error("Load SAPC Error", err.Error(), t.Brand)
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": gateWayDisabledError})
	}
	t.Destination = sapc.CardNumber
	t.Save()
	return c.Render(http.StatusOK, "sapc.html", echo.Map{
		"title":       "صفحه پرداخت نیمه خودکار",
		"captchaId":   captcha.New(),
		"setting":     app.Stg.Rest(),
		"account":     account,
		"cancel":      t.CancelCode,
		"amount":      t.Amount,
		"time_remain": timeRemain.Milliseconds(),
		"destination": t.Destination,
	})
}

func sapcAddCard(c echo.Context) error {
	form := new(Form)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Pan == "" || form.Mobile == "" || !primitive.IsValidObjectID(form.PaymentID) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "شماره کارت اشتباه میباشد"})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	pan := account.Pan{
		Card:       form.Pan,
		Mobile:     form.Mobile,
		NationalID: form.NationalID,
		Birthday:   form.BirthDay,
	}
	if err := pan.AddNewPan(t.Account, t.Brand); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	return c.JSON(http.StatusOK, echo.Map{"msg": "کارت با موفقیت ثبت شد"})
}
func sapcConfirm(c echo.Context) error {
	form := new(Form)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه", "error": err.Error()})
	}
	if form.Pan == "" || !primitive.IsValidObjectID(form.PaymentID) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if !app.IsValidCard(form.Pan) {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "شماره کارت اشتباه میباشد"})
	}
	objID, err := primitive.ObjectIDFromHex(form.PaymentID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	t, err := txn.Load(bson.M{"_id": objID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "مشکل در ورودی درگاه"})
	}
	if sapc.ConfirmTxn(form.Pan, strconv.Itoa(int(t.Amount))) != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	t.Done = true
	t.Message = "OK"
	t.Successful = true
	t.Save()

	return c.JSON(http.StatusOK, echo.Map{"msg": "پرداخت با موفقیت انجام شد"})
}
