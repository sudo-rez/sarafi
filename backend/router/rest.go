package router

import (
	"io"
	"net/http"
	"backend/app"
	"backend/internal/brand"
	"backend/internal/card"
	"backend/internal/dashboard"
	"backend/internal/txn"
	"backend/internal/user"
	"backend/internal/wallet"
	"backend/internal/web"
	"text/template"

	"github.com/labstack/echo/v4"
)

func RegisterPanel(ec *echo.Echo) {
	ec.Renderer = &TemplateRenderer{
		templates: template.Must(template.ParseGlob("./dist/*.html")),
	}
	ec.GET("", func(c echo.Context) error { return c.Render(http.StatusOK, "index.html", nil) })
	ec.GET("/admin/*", func(c echo.Context) error { return c.Render(http.StatusOK, "index.html", nil) })
}

func RegisterV1(ec *echo.Echo) {
	v1G := ec.Group("/api")

	UserEc := user.Echo{
		Prefix: "/user",
	}
	userG := v1G.Group(UserEc.Prefix)
	userG.POST("/c", UserEc.Create, LoginRequired, CheckPermission("usermanagement"))
	userG.GET("/l", UserEc.List, LoginRequired, CheckPermission("usermanagement"))
	userG.PUT("/u", UserEc.Update, LoginRequired, CheckPermission("usermanagement"))
	userG.DELETE("/d", UserEc.Delete, LoginRequired, CheckPermission("usermanagement"))
	userG.POST("/a", UserEc.Auth)
	userG.GET("/current", UserEc.Current, LoginRequired)
	userG.POST("/cp", UserEc.ChangePassword, LoginRequired)
	userG.POST("/cpa", UserEc.ChangePasswordAdmin, LoginRequired)
	userG.POST("/perm", UserEc.SetPermission, LoginRequired)
	userG.GET("/roles", UserEc.RoleList, LoginRequired)

	BrandEc := brand.Echo{
		Prefix: "/brand",
	}
	brandG := v1G.Group(BrandEc.Prefix)
	brandG.POST("/c", BrandEc.Save, LoginRequired)
	brandG.GET("/l", BrandEc.List, LoginRequired)
	brandG.PUT("/u", BrandEc.Save, LoginRequired)
	brandG.DELETE("/d", BrandEc.Delete, LoginRequired)
	brandG.GET("/current", BrandEc.Current, LoginRequired)
	// APC
	brandG.GET("/apc/l", BrandEc.APCList, LoginRequired)
	brandG.POST("/apc/c", BrandEc.APCSave, LoginRequired)
	brandG.POST("/apc/u", BrandEc.APCSave, LoginRequired)
	brandG.DELETE("/apc/d", BrandEc.APCDelete, LoginRequired)
	brandG.GET("/apc/t", BrandEc.APCToggle, LoginRequired)
	// SAPC
	brandG.GET("/sapc/l", BrandEc.SAPCList, LoginRequired)
	brandG.POST("/sapc/c", BrandEc.SAPCSave, LoginRequired)
	brandG.POST("/sapc/u", BrandEc.SAPCSave, LoginRequired)
	brandG.DELETE("/sapc/d", BrandEc.SAPCDelete, LoginRequired)
	brandG.GET("/sapc/t", BrandEc.SAPCToggle, LoginRequired)

	// TXN
	TxnEc := txn.Echo{
		Prefix: "/txn",
	}
	txnG := v1G.Group(TxnEc.Prefix, LoginRequired)
	txnG.GET("/l", TxnEc.List)
	txnG.POST("/l", TxnEc.ListAdvance)
	// WithDraw
	txnG.POST("/wd/l", TxnEc.ListWithdrawAdvanced)
	txnG.GET("/wd/mp/:id", TxnEc.WDManualPay)
	txnG.GET("/wd/rj/:id", TxnEc.WDReject)
	//Queue
	txnG.GET("/wd/q/l", txn.WithDrawQueue)

	// Card
	CardEc := card.Echo{
		Prefix: "/card",
	}
	cardG := v1G.Group(CardEc.Prefix)
	cardG.GET("/info", CardEc.CardInfo, LoginRequired)

	// Wallet
	WalletEc := wallet.Echo{
		Prefix: "/w",
	}
	walletG := v1G.Group(WalletEc.Prefix, LoginRequired)
	walletG.GET("/l", WalletEc.List)
	walletG.POST("/c", WalletEc.Charge)
	walletG.GET("/h", WalletEc.HistoryList)
	walletG.GET("/current", WalletEc.Current)

	// Setting
	SettingEc := app.SettingEcho{
		Prefix: "/setting",
	}
	settingG := v1G.Group(SettingEc.Prefix, LoginRequired)
	settingG.GET("", SettingEc.Current)
	settingG.POST("", SettingEc.Save, SuperAdminRequired)

	// Dashboard
	DashboardEc := dashboard.Echo{
		Prefix: "/dashboard",
	}
	dashboardG := v1G.Group(DashboardEc.Prefix, LoginRequired)
	dashboardG.GET("/base", DashboardEc.BaseInfo)
}

func RegisterGateway(ec *echo.Echo) {
	ec.Renderer = &TemplateRenderer{
		templates: template.Must(template.ParseGlob("./media/*.html")),
	}
	web.Routes(ec)
}

// TemplateRenderer is a custom html/template renderer for Echo framework
type TemplateRenderer struct {
	templates *template.Template
}

// Render renders a template document
func (t *TemplateRenderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {

	// Add global methods if data is a map
	if viewContext, isMap := data.(echo.Map); isMap {
		viewContext["reverse"] = c.Echo().Reverse
	}

	return t.templates.ExecuteTemplate(w, name, data)
}
