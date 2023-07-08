package app

import (
	"fmt"
	"time"

	"github.com/labstack/echo/v4"
)

var (
	Ec  = echo.New()
	Cfg = readConfig()
)

func init() {
}

func Run() {
	Ec.Logger.Fatal(Ec.Start(":" + Cfg.Echo.Port))
}

func Error(msg ...interface{}) {
	logger("Error", msg...)
}
func Info(msg ...interface{}) {
	logger("Info", msg...)
}
func Debug(msg ...interface{}) {
	logger("Debug", msg...)
}
func logger(t string, msg ...interface{}) {
	fmt.Println(fmt.Sprint(time.Now().Format("2006-01-02 15:04:05 | "), t, " ", msg))
}

func AddCSPHeader() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// c.Response().Header().Add("Content-Security-Policy", "default-src 'self'")
			// c.Response().Header().Add("Content-Security-Policy", "style-src 'self' 'unsafe-inline'")
			return next(c)
		}
	}
}
