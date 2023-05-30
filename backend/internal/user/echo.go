package user

import (
	"context"
	"net/http"
	"backend/app"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/random"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	CreateForm struct {
		Username  string `json:"username" form:"username"`
		Password  string `json:"password" form:"password"`
		Brand     string `json:"brand" form:"brand"`
		BrandName string `json:"brand_name" form:"brand_name"`
	}
	UpdateForm struct {
		ID        primitive.ObjectID `json:"_id" form:"_id"`
		BrandName string             `json:"brand_name" form:"brand_name"`
	}
	AuthForm struct {
		Username string `json:"username" form:"username"`
		Password string `json:"password" form:"password"`
		UserCode string `json:"usercode" form:"usercode"`
	}
	ChangePasswordForm struct {
		OldPassword     string `json:"old_password" form:"old_password"`
		Password        string `json:"password" form:"password"`
		ConfirmPassword string `json:"confirm_password" form:"confirm_password"`
	}
	ChangePasswordAdminForm struct {
		Username        string `json:"username" form:"username"`
		Password        string `json:"password" form:"password"`
		ConfirmPassword string `json:"confirm_password" form:"confirm_password"`
	}
	PermissionForm struct {
		Permissions map[string]bool `json:"permissions" form:"permissions"`
	}
)

func (e Echo) Create(c echo.Context) error {
	user := c.Get("user").(User)
	form := new(CreateForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if CheckDuplicate(form.Username) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "duplicate username"})
	}

	u := User{
		ID:        primitive.NewObjectID(),
		Username:  form.Username,
		Password:  app.Hash(form.Password),
		Code:      random.String(6),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if !user.IsAdmin {
		u.BrandName = user.BrandName
		u.Brand = user.Brand
	} else {
		if form.Brand != "" {
			objID, err := primitive.ObjectIDFromHex(form.Brand)
			if err != nil {
				return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
			}
			u.BrandName = form.BrandName
			u.Brand = objID
		}
	}
	if _, err := app.MDB.DB.Collection(CollectionName).InsertOne(context.Background(), u); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) List(c echo.Context) error {
	user := c.Get("user").(User)
	page, limit, sort, res, search := app.Page(c), app.Limit(c), c.QueryParam("sort"), make(UserSlice, 0), c.QueryParam("search")
	q := user.BaseQ()
	if search != "" {
		q["$or"] = []bson.M{
			{"username": bson.M{"$regex": search}},
		}
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
func (e Echo) Update(c echo.Context) error {
	form := new(UpdateForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if _, err := app.MDB.DB.Collection(CollectionName).UpdateOne(context.Background(), bson.M{"_id": form.ID}, bson.M{"$set": form}); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) Delete(c echo.Context) error {
	user := c.Get("user").(User)

	id := app.IdParam(c)
	if id.IsZero() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}
	u, err := Load("_id", id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if (u.IsAdmin || u.IsBrandAdmin) && !user.IsAdmin {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "action invalid"})
	}
	if _, err := app.MDB.CollectionString(CollectionName).DeleteOne(context.Background(), bson.M{"_id": id}); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) Auth(c echo.Context) error {
	form := new(AuthForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	err, ok := AuthUser(form.Username, form.Password, form.UserCode)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if ok {
		token, err := app.CreateJwtToken(form.Username, c)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, echo.Map{"token": token})
	}
	return c.JSON(http.StatusBadRequest, echo.Map{"error": "wrong username or password"})
}
func (e Echo) Current(c echo.Context) error {
	user := c.Get("user").(User)
	return c.JSON(http.StatusOK, echo.Map{"user": user.Rest()})
}
func (e Echo) ChangePassword(c echo.Context) error {
	user := c.Get("user").(User)
	form := new(ChangePasswordForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if form.Password == form.ConfirmPassword {
		if _, ok := AuthUser(user.Username, form.OldPassword, user.Code); ok {
			if err := app.MDB.UpdateOne(CollectionName, bson.M{"username": user.Username}, bson.M{"$set": bson.M{"password": app.Hash(form.Password)}}); err != nil {
				return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
			}
			return c.JSON(http.StatusOK, echo.Map{"result": "success"})
		}
	}
	return c.JSON(http.StatusBadRequest, echo.Map{"error": "wrong password"})
}
func (e Echo) ChangePasswordAdmin(c echo.Context) error {
	id := app.IdParam(c)
	if id.IsZero() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}
	form := new(ChangePasswordAdminForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if form.Password == form.ConfirmPassword {
		if err := app.MDB.UpdateOne(CollectionName, bson.M{"_id": id}, bson.M{"$set": bson.M{"password": app.Hash(form.Password)}}); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, echo.Map{"result": "success"})
	}
	return c.JSON(http.StatusBadRequest, echo.Map{"error": "wrong password"})
}
func (e Echo) SetPermission(c echo.Context) error {
	user := c.Get("user").(User)
	id := app.IdParam(c)
	if id.IsZero() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}
	form := new(PermissionForm)
	if err := c.Bind(form); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	u, err := Load("_id", id)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	if u.ID == user.ID {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "you can not change your permissions"})
	}
	u.Permissions = form.Permissions
	if err := u.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "success"})
}
func (e Echo) RoleList(c echo.Context) error {
	user := c.Get("user").(User)
	if user.IsAdmin {
		return c.JSON(http.StatusOK, echo.Map{"result": Rolelist})
	}
	roles := make([]string, 0)
	for key, value := range user.Permissions {
		if value {
			roles = append(roles, key)
		}
	}
	return c.JSON(http.StatusOK, echo.Map{"result": roles})
}
