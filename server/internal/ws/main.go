package ws

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/labstack/echo"
)

type Handler struct {
	h *Hub
}

func NewHandler(h *Hub) *Handler {
	return &Handler{h: h}
}

func (ws *Handler) Init(e *echo.Echo) {
	e.GET("/getRooms", ws.GetRooms)
	e.GET("/getRoomMembers/:roomId", ws.getRoomMembers)

	e.POST("/createRoom", ws.CreateRoom)
	e.GET("/enterRoom/:roomId/:userId", ws.EnterRoom)
}

func getReq(r *http.Request, obj any) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}

	r.Body = io.NopCloser(bytes.NewReader(body))

	err = json.Unmarshal(body, obj)
	return err
}
