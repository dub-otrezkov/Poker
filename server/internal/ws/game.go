package ws

import (
	"fmt"
	"math/rand"
)

// 0 - Diamonds
// 1 - Hearts
// 2 - Clubs
// 3 - Spades

// 2, 3, 4, 5, 6, 7, 8, 9, 10 + 11 (jack) + 12 (queen) + 13 (king) + 14 (ace)

type Card struct {
	suit int
	rank int
}

var basic_deck = [...]Card{
	{0, 2},
	{0, 3},
	{0, 4},
	{0, 5},
	{0, 6},
	{0, 7},
	{0, 8},
	{0, 9},
	{0, 10},
	{0, 11},
	{0, 12},
	{0, 13},
	{0, 14},

	{1, 2},
	{1, 3},
	{1, 4},
	{1, 5},
	{1, 6},
	{1, 7},
	{1, 8},
	{1, 9},
	{1, 10},
	{1, 11},
	{1, 12},
	{1, 13},
	{1, 14},

	{2, 2},
	{2, 3},
	{2, 4},
	{2, 5},
	{2, 6},
	{2, 7},
	{2, 8},
	{2, 9},
	{2, 10},
	{2, 11},
	{2, 12},
	{2, 13},
	{2, 14},

	{3, 2},
	{3, 3},
	{3, 4},
	{3, 5},
	{3, 6},
	{3, 7},
	{3, 8},
	{3, 9},
	{3, 10},
	{3, 11},
	{3, 12},
	{3, 13},
	{3, 14},
}

type Player struct {
	bal    int
	cards  [2]Card
	client *Client
}

type GameSession struct {
	deck    []Card
	players map[int]*Player

	moves chan Message
}

func (g *GameSession) pop() Card {
	res := g.deck[0]
	g.deck = g.deck[1:]
	return res
}

func NewGameSession(r *Room) *GameSession {
	res := GameSession{players: make(map[int]*Player), moves: make(chan Message, len(r.cl)+1)}

	res.deck = make([]Card, len(basic_deck))
	p := rand.Perm(len(basic_deck))
	for i, j := range p {
		res.deck[i] = basic_deck[j]
	}

	for el := range r.cl {

		res.players[el] = &Player{bal: 5000, cards: [2]Card{res.deck[0], res.deck[1]}, client: r.cl[el]}
		res.deck = res.deck[2:]
	}

	return &res
}

func (g *GameSession) Run() {

	for {
		cl := <-g.moves

		switch cl.Act[1:] {
		case "start":
			for _, el := range g.players {
				el.client.messages <- Message{Act: "~start"}
			}
			for el := range g.players {

				g.players[el].cards = [2]Card{g.pop(), g.pop()}

				g.moves <- Message{RoomId: -1, Act: "~distr", UserId: el, Value: fmt.Sprintf("%v %v %v %v", g.players[el].cards[0].rank, g.players[el].cards[0].suit, g.players[el].cards[1].rank, g.players[el].cards[1].suit)}
			}
		case "distr":
			g.players[cl.UserId].client.messages <- cl

		}

	}
}
