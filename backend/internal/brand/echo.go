package brand

import (
	"context"
	"net/http"
	"backend/app"
	"backend/internal/user"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/random"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type (
	SaveForm struct {
		ID            primitive.ObjectID `json:"_id" form:"_id"`
		Name          string             `json:"name" form:"name"`
		AdminUser     string             `json:"adminuser" form:"adminuser"`
		AdminPassword string             `json:"adminpassword" form:"adminpassword"`
		Key           string             `json:"key" form:"key"`
		Logo          string             `json:"logo" form:"logo"`
		Wage          float64            `json:"wage" form:"wage"`
	}
	APCSaveForm struct {
		ID         primitive.ObjectID `json:"_id" form:"_id"`
		CardNumber string             `json:"card_number" form:"card_number"`
		Name       string             `json:"name" form:"name"`
	}
	SAPCSaveForm struct {
		ID         primitive.ObjectID `json:"_id" form:"_id"`
		CardNumber string             `json:"card_number" form:"card_number"`
		Name       string             `json:"name" form:"name"`
	}
)

func (e Echo) Save(c echo.Context) error {
	form := new(SaveForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	b := Brand{}
	if !form.ID.IsZero() {
		var err error
		b, err = Load("_id", form.ID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
	} else {
		if CheckDuplicate(form.Name) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "duplicate brand name"})
		}
	}
	formerAdmin := ""
	b.Name = form.Name
	b.Key = form.Key
	b.Logo = form.Logo
	b.Wage = form.Wage
	if b.AdminUser != form.AdminUser {
		formerAdmin = b.AdminUser
	}
	b.AdminUser = form.AdminUser

	if err := b.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	if form.AdminUser != "" {
		u, err := user.Load("username", form.AdminUser)
		if err != nil && err.Error() != "mongo: no documents in result" {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		if u.IsAdmin {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "Forbidden Action"})
		}
		if u.Username == "" {
			u.ID = primitive.NewObjectID()
			u.Username = form.AdminUser
			u.Code = random.String(6)
			u.CreatedAt = time.Now()
		}
		u.BrandName = form.Name
		u.Brand = b.ID
		u.UpdatedAt = time.Now()
		u.IsBrandAdmin = true
		if form.AdminPassword != "" {
			u.Password = app.Hash(form.AdminPassword)
		}
		upsert := true
		if _, err := app.MDB.DB.Collection("user").UpdateOne(
			context.Background(), bson.M{"username": form.AdminUser}, bson.M{"$set": u}, &options.UpdateOptions{Upsert: &upsert}); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
	}
	if formerAdmin != "" {
		if _, err := app.MDB.DB.Collection("user").UpdateOne(
			context.Background(), bson.M{"username": formerAdmin}, bson.M{"$set": bson.M{"is_brandadmin": false}}); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) List(c echo.Context) error {
	user := c.Get("user").(user.User)
	page, limit, sort, res, search := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(BrandSlice, 0), c.QueryParam("search")
	q := BaseQ(user.IsAdmin, user.Brand)
	if search != "" {
		q = bson.M{"$or": []bson.M{
			{"name": bson.M{"$regex": search}},
			{"adminuser": bson.M{"$regex": search}},
		}}
	}
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
func (e Echo) Delete(c echo.Context) error {
	id := app.IdParam(c)
	if id.IsZero() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}
	if _, err := app.MDB.CollectionString(CollectionName).DeleteOne(context.Background(), bson.M{"_id": id}); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) Current(c echo.Context) error {
	user := c.Get("user").(user.User)
	if !user.Brand.IsZero() {
		b, err := Load("_id", user.Brand)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, echo.Map{"brand": b.Rest()})
	}
	return c.JSON(http.StatusOK, echo.Map{"msg": "success"})
}

// APC //

func (e Echo) APCSave(c echo.Context) error {
	user := c.Get("user").(user.User)
	var apc APC
	form := new(APCSaveForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if !form.ID.IsZero() {
		var err error
		apc, err = LoadAPC("_id", form.ID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
	} else {
		if CheckDuplicateAPC(form.CardNumber, user.Brand) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "duplicate card"})
		}
	}

	apc.CardNumber = form.CardNumber
	apc.Name = form.Name
	apc.Bank = app.BankNameEN(form.CardNumber)
	apc.Brand = user.Brand

	if err := apc.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) APCList(c echo.Context) error {
	user := c.Get("user").(user.User)

	page, limit, sort, res, search := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(APCSlice, 0), c.QueryParam("search")
	q := bson.M{}
	if !user.IsAdmin {
		q["brand"] = user.Brand
	}
	if search != "" {
		q = bson.M{"$or": []bson.M{
			{"name": bson.M{"$regex": search}},
			{"card_number": bson.M{"$regex": search}},
		}}
	}
	if err := app.MDB.Find(APCCollectionName, q, &res, limit, page, sort); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	totalPages := 0
	if count, err := app.MDB.Count(APCCollectionName, q); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	} else {
		totalPages = count / limit
		if totalPages%limit != 0 {
			totalPages++
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": res.Rest(), "page": page, "total_pages": totalPages})
}
func (e Echo) APCDelete(c echo.Context) error {
	id := app.IdParam(c)
	if id.IsZero() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}
	apc, err := LoadAPC("_id", id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if err := apc.Delete(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) APCToggle(c echo.Context) error {
	user := c.Get("user").(user.User)

	key := c.QueryParam("key")
	idObj, err := primitive.ObjectIDFromHex(c.QueryParam("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	apc, err := LoadAPC("_id", idObj)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if apc.Blocked && !(user.IsAdmin || user.IsBrandAdmin) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "apc blocked"})
	}
	if !apc.Confirmed && !(user.IsAdmin || user.IsBrandAdmin) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "apc not confirmed"})
	}
	switch key {
	case "active":
		apc.Active = !apc.Active
	case "current":
		apc.Current = !apc.Current
	case "blocked":
		if user.IsAdmin || user.IsBrandAdmin {
			apc.Blocked = !apc.Blocked
			apc.Active = false
			apc.Current = false
		}
	case "confirmed":
		if user.IsAdmin || user.IsBrandAdmin {
			apc.Confirmed = !apc.Confirmed
			apc.Active = false
			apc.Current = false
		}
	}
	if err := apc.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	if apc.Current {
		if err := apc.DecurrentOthers(); err != nil {
			if !(err.Error() == "mongo: no documents in result") {
				return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
			}
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}

// SAPC //

func (e Echo) SAPCSave(c echo.Context) error {
	user := c.Get("user").(user.User)
	var sapc SAPC
	form := new(APCSaveForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if !form.ID.IsZero() {
		var err error
		sapc, err = LoadSAPC("_id", form.ID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
	} else {
		if CheckDuplicateSAPC(form.CardNumber, user.Brand) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "duplicate card"})
		}
	}

	sapc.CardNumber = form.CardNumber
	sapc.Name = form.Name
	sapc.Bank = app.BankNameEN(form.CardNumber)
	sapc.Brand = user.Brand

	if err := sapc.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) SAPCList(c echo.Context) error {
	user := c.Get("user").(user.User)

	page, limit, sort, res, search := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(SAPCSlice, 0), c.QueryParam("search")
	q := bson.M{}
	if !user.IsAdmin {
		q["brand"] = user.Brand
	}
	if search != "" {
		q = bson.M{"$or": []bson.M{
			{"name": bson.M{"$regex": search}},
			{"card_number": bson.M{"$regex": search}},
		}}
	}
	if err := app.MDB.Find(SAPCCollectionName, q, &res, limit, page, sort); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	totalPages := 0
	if count, err := app.MDB.Count(SAPCCollectionName, q); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	} else {
		totalPages = count / limit
		if totalPages%limit != 0 {
			totalPages++
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": res.Rest(), "page": page, "total_pages": totalPages})
}
func (e Echo) SAPCDelete(c echo.Context) error {
	id := app.IdParam(c)
	if id.IsZero() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}
	sapc, err := LoadSAPC("_id", id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if err := sapc.Delete(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) SAPCToggle(c echo.Context) error {
	user := c.Get("user").(user.User)

	key := c.QueryParam("key")
	idObj, err := primitive.ObjectIDFromHex(c.QueryParam("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	sapc, err := LoadSAPC("_id", idObj)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if sapc.Blocked && !(user.IsAdmin || user.IsBrandAdmin) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "apc blocked"})
	}
	if !sapc.Confirmed && !(user.IsAdmin || user.IsBrandAdmin) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "apc not confirmed"})
	}
	switch key {
	case "active":
		sapc.Active = !sapc.Active
	case "current":
		sapc.Current = !sapc.Current
	case "blocked":
		if user.IsAdmin || user.IsBrandAdmin {
			sapc.Blocked = !sapc.Blocked
			sapc.Active = false
			sapc.Current = false
		}
	case "confirmed":
		if user.IsAdmin || user.IsBrandAdmin {
			sapc.Confirmed = !sapc.Confirmed
			sapc.Active = false
			sapc.Current = false
		}
	}
	if err := sapc.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	if sapc.Current {
		if err := sapc.DecurrentOthers(); err != nil {
			if !(err.Error() == "mongo: no documents in result") {
				return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
			}
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
