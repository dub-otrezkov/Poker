package main

import (
	"github.com/dub-otrezkov/chess/internal/app"
	db "github.com/dub-otrezkov/chess/internal/database"
)

func main() {

	_, err := db.New()

	if err != nil {
		panic(err)
	}

	a := app.New()

	a.Run(":52")
}
