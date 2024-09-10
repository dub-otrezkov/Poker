package ws

import (
	"fmt"

	"github.com/gorilla/websocket"
)

type Message struct {
	RoomId int    `json:"roomId"`
	Act    string `json:"action"`
	UserId int    `json:"userId"`
	Value  string `json:"value"`
}

type Client struct {
	roomId   int
	userId   int
	conn     *websocket.Conn
	messages chan Message
}

type Room struct {
	cl    map[int]*Client
	ready map[int]interface{}
	game  *GameSession
}

type Hub struct {
	lstRoom int
	rooms   map[int]*Room
	conns   chan Message
	enter   chan *Client
	leave   chan *Client
}

func NewHub() *Hub {
	return &Hub{
		lstRoom: 1,
		rooms:   make(map[int]*Room, 0),
		conns:   make(chan Message),
		enter:   make(chan *Client),
		leave:   make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case cl := <-h.enter:
			if _, ok := h.rooms[cl.roomId]; ok {
				h.rooms[cl.roomId].cl[cl.userId] = cl
			}
		case cl := <-h.leave:

			fmt.Println("left", cl.userId)
			if _, ok := h.rooms[cl.roomId]; ok {

				delete(h.rooms[cl.roomId].cl, cl.userId)
				h.rooms[cl.roomId].ready = make(map[int]interface{})

				for _, el := range h.rooms[cl.roomId].cl {
					el.messages <- Message{RoomId: cl.roomId, Act: "left", UserId: cl.userId, Value: fmt.Sprintf("user %v left room %v", cl.userId, cl.roomId)}
				}
			}

		case ms := <-h.conns:
			fmt.Println("hub got message:", ms)

			switch ms.Act {
			case "start":
				h.rooms[ms.RoomId].game = NewGameSession(h.rooms[ms.RoomId])
				h.rooms[ms.RoomId].game.moves <- Message{Act: "~start"}

				go h.rooms[ms.RoomId].game.Run()
			default:
				if _, ok := h.rooms[ms.RoomId]; ok {
					for _, el := range h.rooms[ms.RoomId].cl {
						el.messages <- ms
					}
				}
			}

		}
	}
}

func (cl *Client) ReadMessages(h *Hub) {
	defer func() {
		h.leave <- cl
		cl.conn.Close()
	}()

	for {
		cont := Message{}
		err := cl.conn.ReadJSON(&cont)

		if err != nil {
			fmt.Println("readerr", err.Error())
			break
		}

		if cont.Act[0] == '~' {
			h.rooms[cl.roomId].game.moves <- cont
		} else {

			switch cont.Act {

			case "ready":

				h.rooms[cl.roomId].ready[cl.userId] = nil
				if len(h.rooms[cl.roomId].ready) == len(h.rooms[cl.roomId].cl) {

					h.conns <- Message{RoomId: cl.roomId, Act: "start", Value: "ready to start"}
				}

			case "move":

				h.rooms[cl.roomId].game.moves <- cont
			default:

				h.conns <- cont
			}
		}
	}
}

func (cl *Client) WriteMessages() {
	defer cl.conn.Close()

	for {

		ms := <-cl.messages

		err := cl.conn.WriteJSON(ms)

		if err != nil {
			fmt.Println(err.Error())

			break
		}
	}
}
