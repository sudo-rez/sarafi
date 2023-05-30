package txn

import (
	"net/http"
	"backend/app"
	"backend/internal/user"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	SearchForm struct {
		Brand       string    `json:"brand"`
		Message     string    `json:"message"`
		AmountS     int64     `json:"amount_s"`
		AmountE     int64     `json:"amount_e"`
		Account     string    `json:"account"`
		Source      string    `json:"source"`
		Destination string    `json:"destination"`
		CreatedAtS  time.Time `json:"created_at_s"`
		CreatedAtE  time.Time `json:"created_at_e"`
	}
	WDSearchForm struct {
		Brand      string    `json:"brand"`
		Account    string    `json:"account"`
		Card       string    `json:"card"`
		AmountS    int64     `json:"amount_s"`
		AmountE    int64     `json:"amount_e"`
		CreatedAtS time.Time `json:"created_at_s"`
		CreatedAtE time.Time `json:"created_at_e"`
	}
)

func (v SearchForm) GenerateQuery(baseQ bson.M, isAdmin bool) bson.M {
	andQ := []bson.M{}

	if v.Brand != "" && isAdmin {
		objId, _ := primitive.ObjectIDFromHex(v.Brand)
		baseQ["brand"] = objId
	}
	if v.Message != "" {
		baseQ["message"] = v.Message
	}
	if v.AmountS > 0 {
		andQ = append(andQ,
			bson.M{"amount": bson.M{"$gte": v.AmountS}})
	}
	if v.AmountE > 0 {
		andQ = append(andQ,
			bson.M{"amount": bson.M{"$lte": v.AmountE}})
	}
	if v.Account != "" {
		baseQ["account"] = v.Account
	}
	if v.Source != "" {
		baseQ["source"] = v.Source
	}
	if v.Destination != "" {
		baseQ["destination"] = v.Destination
	}
	if !v.CreatedAtS.IsZero() {
		andQ = append(andQ,
			bson.M{"created_at": bson.M{"$gte": v.CreatedAtS}})
	}
	if !v.CreatedAtE.IsZero() {
		andQ = append(andQ,
			bson.M{"created_at": bson.M{"$gte": v.CreatedAtS}})
	}
	if len(andQ) > 0 {
		baseQ["$and"] = andQ
	}
	return baseQ
}
func (v WDSearchForm) GenerateQuery(baseQ bson.M, isAdmin bool) bson.M {
	andQ := []bson.M{}

	if v.Brand != "" && isAdmin {
		objId, _ := primitive.ObjectIDFromHex(v.Brand)
		baseQ["brand"] = objId
	}
	if v.Account != "" {
		baseQ["account"] = v.Account
	}
	if v.Card != "" {
		baseQ["card"] = v.Card
	}
	if v.AmountS > 0 {
		andQ = append(andQ,
			bson.M{"amount": bson.M{"$gte": v.AmountS}})
	}
	if v.AmountE > 0 {
		andQ = append(andQ,
			bson.M{"amount": bson.M{"$lte": v.AmountE}})
	}
	if !v.CreatedAtS.IsZero() {
		andQ = append(andQ,
			bson.M{"created_at": bson.M{"$gte": v.CreatedAtS}})
	}
	if !v.CreatedAtE.IsZero() {
		andQ = append(andQ,
			bson.M{"created_at": bson.M{"$gte": v.CreatedAtS}})
	}
	if len(andQ) > 0 {
		baseQ["$and"] = andQ
	}
	return baseQ
}
func (e Echo) List(c echo.Context) error {
	user := c.Get("user").(user.User)
	q := BaseQ(user.IsAdmin, user.Brand)
	page, limit, sort, res := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(TxnSlice, 0)
	if err := app.MDB.Find(CollectionName, q, &res, limit, page, sort); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	totalPages := 0
	if count, err := app.MDB.Count(CollectionName, q); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	} else {
		totalPages = count / limit
		if totalPages%limit != 0 {
			totalPages++
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": res.Rest(), "page": page, "total_pages": totalPages})
}

func (e Echo) ListAdvance(c echo.Context) error {
	user := c.Get("user").(user.User)
	q := BaseQ(user.IsAdmin, user.Brand)
	form := new(SearchForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	q = form.GenerateQuery(q, user.IsAdmin)
	page, limit, sort, res := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(TxnSlice, 0)
	if err := app.MDB.Find(CollectionName, q, &res, limit, page, sort); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	count, err := app.MDB.Count(CollectionName, q)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": res.Rest(), "page": page, "total_pages": app.TotalPages(count, limit)})
}
func WithDrawQueue(c echo.Context) error {
	user := c.Get("user").(user.User)
	if user.IsAdmin {
		return c.JSON(http.StatusOK, echo.Map{"result": MQ.BQ})
	}
	if bQ, ok := MQ.BQ[user.BrandName]; ok {
		return c.JSON(http.StatusOK, echo.Map{"result": echo.Map{user.BrandName: bQ}})
	}
	return c.JSON(http.StatusBadRequest, echo.Map{"error": "brand error"})
}
func (e Echo) ListWithdrawAdvanced(c echo.Context) error {
	user := c.Get("user").(user.User)
	q := BaseQ(user.IsAdmin, user.Brand)
	form := new(WDSearchForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	q = form.GenerateQuery(q, user.IsAdmin)
	page, limit, sort, res := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(WithdrawSlice, 0)
	if err := app.MDB.Find(WDCollectionName, q, &res, limit, page, sort); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	count, err := app.MDB.Count(WDCollectionName, q)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": res.Rest(), "page": page, "total_pages": app.TotalPages(count, limit)})
}
func (e Echo) WDManualPay(c echo.Context) error {
	user := c.Get("user").(user.User)
	wdID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	wd, err := LoadWD(bson.M{"_id": wdID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if !user.IsAdmin && wd.Brand != user.Brand {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "you don't have permission"})
	}
	wd.Remaining = 0
	wd.Manual = true
	wd.InProgress = false
	wd.Done = true

	if err := wd.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) WDReject(c echo.Context) error {
	user := c.Get("user").(user.User)
	wdID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	wd, err := LoadWD(bson.M{"_id": wdID})
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if !user.IsAdmin && wd.Brand != user.Brand {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "you don't have permission"})
	}
	wd.InProgress = false
	wd.Done = true
	wd.Rejected = true
	wd.Remaining = 0

	if err := wd.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
