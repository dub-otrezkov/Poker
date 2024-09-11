package main

import (
	// services
	"fmt"

	"github.com/dub-otrezkov/chess/server/internal/app"
	ws "github.com/dub-otrezkov/chess/server/internal/ws"

	db "github.com/dub-otrezkov/chess/server/internal/database"
	"github.com/dub-otrezkov/chess/server/pkg/auth"
)

func main() {

	database, err := db.New()

	if err != nil {
		panic(err)
	}

	a := app.New()
	wsHandler := ws.NewHandler()

	auth := auth.New(database)

	a.Run(":52", auth, wsHandler)

	fmt.Println("connected")
}
