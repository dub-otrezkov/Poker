package app

import (
	"io"
	"net/http"
	"text/template"

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

	e.Renderer = &HTMLRenderer{template.Must(template.ParseGlob("client/**/**/*.html"))}

	e.GET("/", func(c echo.Context) error {
		return c.Render(http.StatusOK, "mainpage.html", nil)
	})

	e.Static("static", "client")

	e.Logger.Fatal(e.Start(port))
}
