package ws

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/labstack/echo"
)

type Handler struct {
	lstRoom int
	rooms   map[int]*Room
}

func NewHandler() *Handler {
	return &Handler{rooms: make(map[int]*Room)}
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

func less(a, b []int) bool {
	for i := 0; i < max(len(a), len(b)); i++ {
		if i == len(a) {
			return true
		}
		if i == len(b) {
			return false
		}

		if a[i] != b[i] {
			return (a[i] < b[i])
		}
	}

	return true
}

func max_ar(a []int) int {
	ans := a[0]
	for _, el := range a {
		ans = max(ans, el)
	}
	return ans
}

func min_ar(a []int) int {
	ans := a[0]
	for _, el := range a {
		ans = min(ans, el)
	}
	return ans
}

func eq(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
