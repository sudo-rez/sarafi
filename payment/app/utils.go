package app

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var (
	Hashkey = []byte("!@#$%^&*()QazWsC")
)

func Page(c echo.Context) int {
	p, _ := strconv.Atoi(c.QueryParam("page"))
	if p < 1 {
		p = 1
	}
	return p
}
func Limit(c echo.Context) int {
	l, _ := strconv.Atoi(c.QueryParam("limit"))
	if l < 1 {
		l = 10
	}
	return l
}
func IdParam(c echo.Context) primitive.ObjectID {
	idObj, _ := primitive.ObjectIDFromHex(c.QueryParam("id"))
	return idObj
}
func Hash(v string) string {
	plaintext := []byte(v)
	block, err := aes.NewCipher(Hashkey)
	if err != nil {
		Error(err.Error())
		return ""
	}
	ciphertext := make([]byte, aes.BlockSize+len(plaintext))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		Error(err.Error())
		return ""
	}
	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintext)
	return base64.URLEncoding.EncodeToString(ciphertext)
}
func DeHash(v string) string {
	ciphertext, _ := base64.URLEncoding.DecodeString(v)
	block, err := aes.NewCipher(Hashkey)
	if err != nil {
		Error(err.Error())
		return ""
	}
	if len(ciphertext) < aes.BlockSize {
		return ""
	}
	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]
	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(ciphertext, ciphertext)
	return string(ciphertext)
}

type JwtClaims struct {
	Username string `json:"user"`
	jwt.StandardClaims
}

func CreateJwtToken(username string, c echo.Context) (string, error) {
	claims := new(JwtClaims)
	claims.Username = username
	claims.ExpiresAt = time.Now().Add(time.Hour * 2).Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenstr, err := token.SignedString(Hashkey)
	return tokenstr, err
}

func BankNameEN(card string) string {
	if len(card) > 6 {
		if bank, ok := IranBanks[card[:6]]; ok {
			return bank[1]
		}
	}
	return ""
}

// returns page,limit,search,sort
func BasicParams(c echo.Context) (int, int, string, string) {
	return Page(c), Limit(c), c.QueryParam("search"), c.QueryParam("sort")
}

func IsValidCard(card string) bool {
	if len(card) == 16 {
		res := 0
		for i, r := range card {
			digit := int(r - '0')
			if (i+1)%2 == 0 {
				res = res + digit
			} else {
				mul := digit * 2
				if mul > 9 {
					mul = mul - 9
				}
				res = res + mul
			}
		}
		if res%10 == 0 {
			return true
		}
	}
	return false
}

func TotalPages(count, limit int) int {
	var totalPages = count / limit
	if count%limit != 0 {
		totalPages++
	}
	return totalPages
}

// ToEnglishDigits Converts all Persian digits in the string to English digits.
func ToEnglishDigits(text string) string {
	return strings.NewReplacer(
		"۰", "0",
		"۱", "1",
		"۲", "2",
		"۳", "3",
		"۴", "4",
		"۵", "5",
		"۶", "6",
		"۷", "7",
		"۸", "8",
		"۹", "9",
	).Replace(text)
}
