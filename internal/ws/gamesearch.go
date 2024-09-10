package ws

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) GetRooms(c echo.Context) error {
	al := make([]int, 0, len(h.h.rooms))
	for el := range h.h.rooms {
		al = append(al, el)
	}

	return c.JSON(http.StatusOK, map[string]any{"lst": al})
}

func (h *Handler) getRoomMembers(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("roomId"))

	if err != nil {
		return c.JSON(http.StatusOK, map[string]interface{}{"err": err.Error()})
	}

	res := []int{}

	if _, ok := h.h.rooms[id]; ok {
		for _, el := range h.h.rooms[id].cl {
			res = append(res, el.userId)
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"users": res})
}

func (h *Handler) CreateRoom(c echo.Context) error {
	h.h.rooms[h.h.lstRoom] = &Room{
		cl:    make(map[int]*Client),
		ready: make(map[int]interface{}),
		game:  nil,
	}
	h.h.lstRoom++

	return c.JSON(http.StatusOK, map[string]interface{}{"id": h.h.lstRoom - 1})
}

func (h *Handler) EnterRoom(c echo.Context) error {
	userId, _ := strconv.Atoi(c.Param("userId"))
	roomId, _ := strconv.Atoi(c.Param("roomId"))

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)

	if err != nil {
		return c.JSON(http.StatusBadGateway, err.Error())
	}

	cl := &Client{
		roomId:   roomId,
		userId:   userId,
		conn:     conn,
		messages: make(chan Message),
	}

	h.h.enter <- cl

	h.h.conns <- Message{
		Act:    "enter",
		UserId: userId,
		RoomId: roomId,
		Value:  fmt.Sprintf("user %v entered room", userId),
	}

	go cl.WriteMessages()
	go cl.ReadMessages(h.h)

	return c.JSON(http.StatusOK, nil)
}
