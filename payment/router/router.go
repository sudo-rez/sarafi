package router

import (
	"net/http"
	"payment/app"

	"github.com/labstack/echo/v4"
)

func Register(ec *echo.Echo) {
	v1G := ec.Group("/v1")
	v1G.POST("/code", code)
	v1G.POST("/verify", verify)

}

func code(c echo.Context) error {
	form := new(codeForm)
	if err := c.Bind(form); err != nil {
		app.Error("error in binding form", err.Error())
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	bank, err := form.DiscoverBank(form.Source)
	if err != nil {
		app.Error("error in discovering bank", err.Error())
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	switch bank {
	case "Sepah":
		return form.Sepah(c)
	default:
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "bank not supported"})
	}
}
func verify(c echo.Context) error {
	form := new(verifyForm)
	if err := c.Bind(form); err != nil {
		app.Error("error in binding form", err.Error())
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	bank, err := form.DiscoverBank(form.Source)
	if err != nil {
		app.Error("error in discovering bank", err.Error())
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	switch bank {
	case "Sepah":
		return form.SepahVerify(c)
	default:
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "bank not supported"})
	}
}
