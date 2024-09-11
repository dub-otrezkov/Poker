package ws

import (
	"fmt"

	"github.com/gorilla/websocket"
)

type RawMessage struct {
	Act   string `json:"action"`
	Value string `json:"value"`
	Type  string `json:"type"`
}

type Message struct {
	Act    string
	Value  string
	RoomId int
	UserId int
	Type   string
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

	alerts chan Message
	enter  chan *Client
	leave  chan *Client
}

func (r *Room) Run() {
	defer close(r.alerts)
	defer close(r.enter)
	defer close(r.leave)

	for {
		select {
		case cl := <-r.enter:

			r.alerts <- Message{
				Act:    "enter",
				Value:  fmt.Sprintf("user %v enter room #%v", cl.userId, cl.roomId),
				RoomId: cl.roomId,
				UserId: cl.userId,
			}

			r.cl[cl.userId] = cl
		case cl := <-r.leave:

			delete(r.cl, cl.userId)

			r.alerts <- Message{
				Act:    "left",
				Value:  fmt.Sprintf("user %v left room #%v", cl.userId, cl.roomId),
				RoomId: cl.roomId,
				UserId: cl.userId,
			}

		case ms := <-r.alerts:
			if ms.Type == "game" {
				r.game.moves <- ms
			} else {

				fmt.Println(ms)

				switch ms.Act {
				case "ready":
					r.ready[ms.UserId] = nil

					if len(r.ready) == len(r.cl) {

						fmt.Println("STARTTTTT")

						r.game = NewGameSession(r)
						r.game.moves <- Message{Act: "start", Value: "game started"}

						go r.game.Run()
					}
				default:
					for _, el := range r.cl {
						el.messages <- ms
					}
				}
			}
		}
	}
}

func (cl *Client) ReadMessages(r *Room) {
	defer func() {
		r.leave <- cl
		cl.conn.Close()
	}()

	for {
		cont := RawMessage{}
		err := cl.conn.ReadJSON(&cont)

		if err != nil {
			fmt.Println("websockets.go:ReadMessages : ", err.Error())
			break
		}

		r.alerts <- Message{
			Act:    cont.Act,
			Value:  cont.Value,
			Type:   cont.Type,
			RoomId: cl.roomId,
			UserId: cl.userId,
		}
	}
}

func (cl *Client) WriteMessages() {

	for {

		ms := <-cl.messages

		err := cl.conn.WriteJSON(RawMessage{Act: ms.Act, Value: ms.Value})

		if err != nil {
			fmt.Println(err.Error())

			break
		}
	}
}
