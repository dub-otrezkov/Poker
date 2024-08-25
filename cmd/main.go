package main

import (
	// services
	"fmt"

	"github.com/dub-otrezkov/chess/internal/app"
	db "github.com/dub-otrezkov/chess/internal/database"
	"github.com/dub-otrezkov/chess/pkg/auth"
)

func main() {

	database, err := db.New()

	if err != nil {
		panic(err)
	}

	a := app.New()

	auth := auth.New(database)

	a.Run(":52", auth)

	fmt.Println("connected")
}
