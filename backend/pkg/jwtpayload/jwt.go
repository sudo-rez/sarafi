package jwtpayload

import (
	"backend/app"
	"backend/internal/brand"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

type JwtClaims struct {
	Info Info `json:"info"`
	jwt.StandardClaims
}
type Info struct {
	Account        any    `json:"account"`
	Amount         string `json:"amount"`
	CallBackUrl    string `json:"callback_url"`
	CallBackMethod string `json:"callback_method"`
	FailUrl        string `json:"fail_url"`
	SuccessUrl     string `json:"success_url"`
	SiteUrl        string `json:"site_url"`
	PaymentID      string `json:"payment_id"`
	Currency       string `json:"currency"`
	Country        string `json:"country"`
	ClientIP       string `json:"client_ip"`
	Pan            string `json:"pan"`
	ID             string `json:"id"`
}

func (v Info) Rest() echo.Map {
	return echo.Map{
		"account":      v.Account,
		"amount":       v.Amount,
		"callback_url": v.CallBackUrl,
	}
}

func GetInfoFromToken(c echo.Context) (*Info, *brand.Brand, error) {
	tokenStr := c.FormValue("token")
	if tokenStr == "" {
		tokenStr = c.QueryParam("token")
		if tokenStr == "" {
			return nil, nil, errors.New("token required")
		}
	}
	claims := &JwtClaims{}
	brands, err := brand.GetBrands()
	if err != nil {
		return nil, nil, err
	}
	for _, b := range brands {
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(b.Key), nil
		})
		if err != nil {
			app.Error(err.Error())
		}
		if token == nil || !token.Valid {
			continue
		}
		claims, ok := token.Claims.(*JwtClaims)
		if !ok || claims.ExpiresAt < time.Now().Unix() {
			app.Error("expired token , brand: "+b.Name, "token: "+tokenStr)
			continue
		}
		claims.Info.Account = claims.Info.StringAccount()
		return &claims.Info, &b, nil
	}
	return nil, nil, errors.New("invalid token")
}

func (v *Info) StringAccount() string {
	switch v.Account.(type) {
	case string:
		return v.Account.(string)
	case int:
		return strconv.Itoa(v.Account.(int))
	case int64:
		return strconv.FormatInt(v.Account.(int64), 10)
	case float64:
		return fmt.Sprint(int(v.Account.(float64)))
	}
	return fmt.Sprint(v.Account)
}
