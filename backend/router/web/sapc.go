package web

import (
	"backend/app"
	"backend/internal/account"
	"backend/internal/brand"
	"backend/internal/txn"
	"backend/internal/wallet"
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
	// if !account.SAPCActive {
	// 	return c.Redirect(http.StatusFound, fmt.Sprint("/apc?p=", t.ID.Hex()))
	// }

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
		"title":            "صفحه پرداخت نیمه خودکار",
		"captchaId":        captcha.New(),
		"setting":          app.Stg.Rest(),
		"account":          account,
		"cancel":           t.CancelCode,
		"amount":           t.Amount,
		"time_remain":      timeRemain.Milliseconds(),
		"destination":      t.Destination,
		"destination_name": sapc.Name,
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
		Card:   form.Pan,
		Mobile: form.Mobile,
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
	sapcV, err := brand.LoadSAPCQ(bson.M{"brand": t.Brand, "card_number": t.Destination})
	if err != nil {
		app.Error("Load SAPC Error", err.Error(), t.Brand)
		return c.JSON(http.StatusInternalServerError, echo.Map{"msg": gateWayDisabledError})
	}
	if sapc.ConfirmTxn(form.Pan, sapcV.CardNumber, strconv.Itoa(int(t.Amount))) != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"msg": "لطفا دقایقی بعد تلاش کنید"})
	}
	t.Done = true
	t.Message = "OK"
	t.Successful = true
	t.Source = form.Pan
	t.Save()
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

	return c.JSON(http.StatusOK, echo.Map{"msg": "پرداخت با موفقیت انجام شد"})
}
