package wallet

import (
	"net/http"
	"backend/app"
	"backend/internal/brand"
	"backend/internal/user"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	ChargeForm struct {
		Brand    primitive.ObjectID `json:"brand" form:"brand"`
		Amount   float64            `json:"amount" form:"amount"`
		Currency string             `json:"currency" form:"currency"`
	}
)

func (e Echo) Charge(c echo.Context) error {
	user := c.Get("user").(user.User)

	form := new(ChargeForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	wal, err := LoadQ(bson.M{"brand": form.Brand, "currency": form.Currency})
	if err != nil && err.Error() != "mongo: no documents in result" {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	} else if wal.ID.IsZero() {
		wal = Wallet{Brand: form.Brand, Currency: form.Currency}
		if err := wal.Save(); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
	}
	his := History{
		Type:     "charge",
		Amount:   form.Amount,
		Currency: form.Currency,
		Wallet:   wal.ID,
		By:       user.Username,
	}
	if his.Amount < 0 {
		his.Type = "decharge"
	}
	if err := his.Create(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	go wal.Update()
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) List(c echo.Context) error {
	page, limit, sort, res := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(WalletSlice, 0)
	if err := app.MDB.Find(CollectionName, bson.M{}, &res, limit, page, sort); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	totalPages := 0
	if count, err := app.MDB.Count(CollectionName, bson.M{}); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	} else {
		totalPages = count / limit
		if totalPages%limit != 0 {
			totalPages++
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": res.FullRest(), "page": page, "total_pages": totalPages})
}
func (e Echo) HistoryList(c echo.Context) error {
	page, limit, sort, res, wallet := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(HistorySlice, 0), c.QueryParam("wallet")
	wObjID, _ := primitive.ObjectIDFromHex(wallet)
	q := bson.M{"wallet": wObjID}
	if err := app.MDB.Find(HistoryCollectionName, q, &res, limit, page, sort); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	totalPages := 0
	if count, err := app.MDB.Count(HistoryCollectionName, q); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	} else {
		totalPages = count / limit
		if totalPages%limit != 0 {
			totalPages++
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": res.Rest(), "page": page, "total_pages": totalPages})
}

//	func (e Echo) Delete(c echo.Context) error {
//		id := app.IdParam(c)
//		if id.IsZero() {
//			return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
//		}
//		if _, err := app.MDB.CollectionString(CollectionName).DeleteOne(context.Background(), bson.M{"_id": id}); err != nil {
//			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
//		}
//		return c.JSON(http.StatusOK, echo.Map{"result": "success"})
//	}
func (e Echo) Current(c echo.Context) error {
	user := c.Get("user").(user.User)
	if user.BrandName != "" {
		b, err := brand.Load("name", user.BrandName)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		w, err := Load("brand", b.ID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, echo.Map{"wallet": w.Rest()})
	}
	return c.JSON(http.StatusOK, echo.Map{"msg": "success"})
}
