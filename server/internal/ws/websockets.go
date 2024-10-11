package ws

import (
	"encoding/json"
	"fmt"
)

func (r *Room) Run() {
	defer close(r.alerts)
	defer close(r.enter)
	defer close(r.leave)

	for {
		select {
		case cl := <-r.enter:

			r.alerts <- Message{
				Act:    "enter",
				Value:  JSONContent{"content": fmt.Sprint(cl.userId)},
				RoomId: cl.roomId,
				UserId: cl.userId,
			}

			r.cl[cl.userId] = cl
		case cl := <-r.leave:

			delete(r.cl, cl.userId)

			r.alerts <- Message{
				Act:    "left",
				Value:  JSONContent{"content": fmt.Sprint(cl.userId)},
				RoomId: cl.roomId,
				UserId: cl.userId,
			}
			r.ready = make(map[int]interface{})

		case ms := <-r.alerts:
			if ms.Type == Game {
				fmt.Println(ms)

				r.game.moves <- ms
			} else {

				switch ms.Act {
				case "ready":

					r.ready[ms.UserId] = nil

					if len(r.ready) == len(r.cl) {

						r.game = NewGameSession(r)
						r.game.moves <- Message{Act: "start", Value: JSONContent{"content": "game started"}}

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
			fmt.Println("llll:", err.Error(), cont)
			break
		}

		r.alerts <- Message{
			Act:    cont.Act,
			Value:  JSONContent{"content": cont.Value},
			Type:   cont.Type,
			RoomId: cl.roomId,
			UserId: cl.userId,
		}
	}
}

func (cl *Client) WriteMessages() {

	for {

		ms := <-cl.messages

		cont, _ := json.Marshal(ms.Value)
		err := cl.conn.WriteJSON(RawMessage{Act: ms.Act, Value: string(cont[:])})
		fmt.Println(string(cont[:]))
		if err != nil {
			fmt.Println(err.Error())
			break
		}
	}
}
