package router

import (
	"net/http"
	"backend/app"
	"backend/internal/user"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
)

func LoginRequired(n echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		tokenStr := c.Request().Header.Get("Authorization")
		claims := &app.JwtClaims{}
		token, _ := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return app.Hashkey, nil
		})
		if token == nil || !token.Valid {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "token not valid"})
		}
		claims, ok := token.Claims.(*app.JwtClaims)
		if !ok {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "token not valid"})
		}
		u := user.User{}
		if err := app.MDB.FindOne("user", bson.M{"username": claims.Username}, &u); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "user not found"})
		}
		c.Set("user", u)
		return n(c)
	}
}
func SuperAdminRequired(n echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		user := c.Get("user").(user.User)
		if user.IsAdmin {
			return n(c)
		}

		return c.JSON(http.StatusForbidden, echo.Map{"error": "you don't have permission"})
	}
}
func BrandAdminRequired(n echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		user := c.Get("user").(user.User)
		if user.IsBrandAdmin {
			return n(c)
		}
		return c.JSON(http.StatusForbidden, echo.Map{"error": "you don't have permission"})
	}
}

func CheckPermission(perm string) func(n echo.HandlerFunc) echo.HandlerFunc {
	return func(n echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user := c.Get("user").(user.User)
			if user.IsAdmin {
				return n(c)
			}
			if hasPerm, ok := user.Permissions[perm]; ok {
				if hasPerm {
					return n(c)
				}
			}
			return c.JSON(http.StatusForbidden, echo.Map{"error": "you don't have permission"})
		}
	}
}
