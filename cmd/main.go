package main

import (
	// services
	"fmt"

	"github.com/dub-otrezkov/chess/internal/app"
	ws "github.com/dub-otrezkov/chess/internal/ws"

	db "github.com/dub-otrezkov/chess/internal/database"
	"github.com/dub-otrezkov/chess/pkg/auth"
)

func main() {

	database, err := db.New()

	if err != nil {
		panic(err)
	}

	a := app.New()
	hub := ws.NewHub()
	wsHandler := ws.NewHandler(hub)

	go hub.Run()

	auth := auth.New(database)

	a.Run(":52", auth, wsHandler)

	fmt.Println("connected")
}
