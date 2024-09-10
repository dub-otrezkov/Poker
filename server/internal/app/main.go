package app

import (
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

type App struct {
}

func New() *App {
	return &App{}
}

type service interface {
	Init(*echo.Echo)
}

func (*App) Run(port string, services ...service) {

	e := echo.New()

	for _, s := range services {
		s.Init(e)
	}

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
	}))

	e.Logger.Fatal(e.Start(port))
}
