package dashboard

import (
	"net/http"
	"backend/internal/txn"
	"backend/internal/user"
	"backend/internal/wallet"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Echo struct {
		Prefix string
	}
)

func (e Echo) BaseInfo(c echo.Context) error {
	user := c.Get("user").(user.User)
	t := time.Now()
	start := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 1, 1, time.UTC)
	end := time.Date(t.Year(), t.Month(), t.Day()+1, 0, 0, 1, 1, time.UTC)
	andQ := []bson.M{{"created_at": bson.M{"$gte": primitive.NewDateTimeFromTime(start)}}, {"created_at": bson.M{"$lt": primitive.NewDateTimeFromTime(end)}}}

	wdQ := bson.M{"done": false}
	if !user.IsAdmin {
		wdQ["brand"] = user.Brand
	}
	remaningWd, err := txn.RemainingWD(wdQ)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	wdQ["$and"] = andQ
	paidtoday, err := txn.PaidinTimeWD(wdQ)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	txnQ := txn.BaseQ(user.IsAdmin, user.Brand)

	txnQ["$and"] = andQ
	todaytxn, todaytxncount, err := txn.TxnAmountCountInDay(txnQ)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	todayProfit, err := wallet.ProfitInDay(start, end, user.IsAdmin)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"wd_remaining": remaningWd,
		"todaytxn":      todaytxn,
		"todaytxncount": todaytxncount,
		"paidtoday":     paidtoday,
		"todayprofit":   int64(todayProfit)})

}
