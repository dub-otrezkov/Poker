package ws

import (
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
	al := make([]int, 0, len(h.rooms))
	for el := range h.rooms {
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

	if _, ok := h.rooms[id]; ok {
		for _, el := range h.rooms[id].cl {
			res = append(res, el.userId)
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"users": res})
}

func (h *Handler) CreateRoom(c echo.Context) error {
	h.lstRoom++
	h.rooms[h.lstRoom] = &Room{
		cl:    make(map[int]*Client),
		ready: make(map[int]interface{}),
		game:  nil,

		alerts: make(chan Message, 100),
		enter:  make(chan *Client, 100),
		leave:  make(chan *Client, 100),
	}
	go h.rooms[h.lstRoom].Run()

	return c.JSON(http.StatusOK, map[string]interface{}{"id": h.lstRoom})
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

	h.rooms[roomId].enter <- cl

	go cl.WriteMessages()
	go cl.ReadMessages(h.rooms[roomId])

	return c.JSON(http.StatusOK, nil)
}
