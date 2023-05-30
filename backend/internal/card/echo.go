package card

import (
	"net/http"
	"backend/app"
	"backend/internal/thirdparty"

	"github.com/labstack/echo/v4"
)

type (
	Echo struct {
		Prefix string
	}
)

func (e Echo) CardInfo(c echo.Context) error {
	cardNumber := c.QueryParam("c")
	if !app.IsValidCard(cardNumber) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid card"})
	}
	info, err := thirdparty.CardInfo(cardNumber)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, echo.Map{"info": info})
}
