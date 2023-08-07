package account

import (
	"backend/app"
	"backend/internal/user"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	Echo struct {
		Prefix string
	}
)

func (e Echo) List(c echo.Context) error {
	user := c.Get("user").(user.User)
	page, limit, search, sort := app.BasicParams(c)
	brand, _ := primitive.ObjectIDFromHex(c.QueryParam("brand"))
	if !user.IsAdmin {
		brand = user.Brand
	}
	account, total, err := LoadSlice(page, limit, search, sort, brand)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"total_pages": app.TotalPages(total, limit),
		"result":      account.Rest(),
		"page":        page,
	})
}
func (e Echo) ToggleSAPC(c echo.Context) error {
	user := c.Get("user").(user.User)
	id, _ := primitive.ObjectIDFromHex(c.Param("id"))
	q := bson.M{"_id": id}
	if !user.IsAdmin {
		q["brand"] = user.Brand
	}
	account, err := Load(q)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	account.SAPCActive = !account.SAPCActive
	if err := account.Save(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"result": "ok"})
}
