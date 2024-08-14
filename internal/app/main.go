package app

import (
	"github.com/labstack/echo"
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

	e.Logger.Fatal(e.Start(port))
}
