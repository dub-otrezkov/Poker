package auth

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/dub-otrezkov/OschApp/pkg/hasher"
	"github.com/labstack/echo"
)

type Database interface {
	GetUser(string) (map[string]interface{}, error)
	RegisterUser(string, string) error
}

type Auth struct {
	db Database
}

func New(db Database) *Auth {
	return &Auth{db: db}
}

func (auth *Auth) Init(e *echo.Echo) {
	e.GET("/test_auth", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"a": "d", "b": "c"})
	})

	e.POST("/login", auth.Login)
	e.POST("/register", auth.Register)
}

func (auth *Auth) Login(c echo.Context) error {

	body, _ := io.ReadAll(c.Request().Body)

	qr := make(map[string]string)
	err := json.Unmarshal(body, &qr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}
	cor, err := auth.db.GetUser(qr["login"])

	c.Logger().Print(cor)
	c.Logger().Print(qr)

	if err == nil && cor["password"] == hasher.CalcSha256(qr["password"]) {
		return nil
	} else {
		return c.JSON(http.StatusBadRequest, "неправильный пароль")
	}
}

func (auth *Auth) Register(c echo.Context) error {

	body, _ := io.ReadAll(c.Request().Body)

	c.Request().Body = io.NopCloser(bytes.NewReader(body))

	qr := make(map[string]string)
	err := json.Unmarshal(body, &qr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	qr["password"] = hasher.CalcSha256(qr["password"])

	err = auth.db.RegisterUser(qr["login"], qr["password"])

	if err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	return auth.Login(c)
}
