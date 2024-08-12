package app

import "github.com/labstack/echo"

type App struct {
}

func New() *App {
	return &App{}
}

func (*App) Run() {

	e := echo.New()

	e.Logger.Fatal(e.Start("8080"))
}
