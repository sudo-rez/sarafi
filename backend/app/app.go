package app

import (
	"fmt"
	"backend/pkg/mongo"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var (
	Ec  = echo.New()
	Cfg = readConfig()
	Stg = defaultSetting
	MDB *mongo.Conn
)

func init() {
	var err error
	MDB, err = mongo.InitMongoConnection(mongo.Config{DBName: Cfg.Mongo.DB, URI: Cfg.Mongo.URI})
	if err != nil {
		panic(err.Error())
	}
	Stg = readSetting()
	Ec.Use(middleware.Logger(), AddCSPHeader())

	Ec.Static("/*", Cfg.Echo.MediaPath)

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
