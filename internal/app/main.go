package app

import (
	"io"
	"text/template"

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

type HTMLRenderer struct {
	t *template.Template
}

func (rn *HTMLRenderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return rn.t.ExecuteTemplate(w, name, data)
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
