package ws

import (
	"fmt"
	"math/rand"
	"sort"
	"strconv"
)

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

var mins = map[string]int{"": 0, "small blind": 10, "big blind": 20}

type Player struct {
	bal     int
	active  bool
	cur_bid int

	cards  [2]Card
	client *Client

	role string
}

type GameSession struct {
	deck    []Card
	players map[int]*Player

	order   []int
	cur_st  int
	cur_bid int
	bank    int

	moves chan Message
}

func (g *GameSession) pop() Card {
	res := g.deck[0]
	g.deck = g.deck[1:]
	return res
}

func NewGameSession(r *Room) *GameSession {
	res := GameSession{players: make(map[int]*Player), moves: make(chan Message, 100)}

	for el := range r.cl {

		res.players[el] = &Player{
			bal:     5000,
			active:  true,
			cur_bid: 0,

			client: r.cl[el],
		}
		res.order = append(res.order, el)
	}

	return &res
}

func (g *GameSession) Run() {
	defer close(g.moves)

	bids := make(chan int, 100)

	alive := true
	cnt_u := len(g.players)

	var al_cards []Card

	for alive {
		cl := <-g.moves

		switch cl.Act {
		case "start":

			g.deck = make([]Card, len(basic_deck))
			p := rand.Perm(len(basic_deck))
			for i, j := range p {
				g.deck[i] = basic_deck[j]
			}

			for el := range g.players {

				g.players[el].cards = [2]Card{g.deck[0], g.deck[1]}
				g.deck = g.deck[2:]
			}

			for _, el := range g.players {
				el.client.messages <- Message{Act: "start"}
			}
			for el := range g.players {

				g.players[el].cards = [2]Card{g.pop(), g.pop()}
				g.moves <- Message{
					RoomId: -1,
					Act:    "distr",
					UserId: el,
					Value:  fmt.Sprintf("%v %v %v %v", g.players[el].cards[0].rank, g.players[el].cards[0].suit, g.players[el].cards[1].rank, g.players[el].cards[1].suit),
				}
			}

			go func() {

				for g.cur_st <= 3 {

					for _, el := range g.order {
						g.players[el].role = ""
						g.players[el].cur_bid = 0
					}

					g.players[g.order[0]].role = "small blind"
					g.players[g.order[1]].role = "big blind"

					for {
						ok := g.cur_bid != 0
						for _, el := range g.order {

							if !(!g.players[el].active || (g.players[el].active && (g.players[el].cur_bid == g.cur_bid || g.players[el].bal == 0))) {
								ok = false
							}
						}

						if ok {
							break
						}

						cur_u := g.order[0]

						if !g.players[cur_u].active || g.players[cur_u].bal == 0 {
							continue
						}

						if max(mins[g.players[cur_u].role], g.cur_bid) >= g.players[cur_u].bal {
							g.moves <- Message{Act: "make_bid", Value: "allin", UserId: cur_u}
						} else {
							g.moves <- Message{Act: "make_bid", Value: fmt.Sprint(max(mins[g.players[cur_u].role], g.cur_bid)), UserId: cur_u}
						}

						b := <-bids
						if b > 0 {
							g.cur_bid = max(g.cur_bid, b)
							g.bank += b
							g.players[cur_u].cur_bid = b
							g.players[cur_u].bal -= b

							if g.players[cur_u].bal == 0 {
								cnt_u--
							}
						} else {
							g.players[cur_u].active = false
							cnt_u--
						}

						if cnt_u == 1 {
							goto end
						}

						g.order = append(g.order[1:], g.order[0])
					}

					if g.cur_st == 0 {

						for i := 0; i < 3; i++ {

							x := g.pop()
							al_cards = append(al_cards, x)

							g.moves <- Message{Act: "add_card", Value: fmt.Sprintf("%v %v", x.rank, x.suit)}
						}
					} else if g.cur_st < 3 {

						x := g.pop()
						al_cards = append(al_cards, x)

						g.moves <- Message{Act: "add_card", Value: fmt.Sprintf("%v %v", x.rank, x.suit)}
					} else {

						goto end
					}

					g.cur_bid = 0
					g.cur_st++
				}

			end:

				// 0 - biggest card, 1 - pair, 2 - triples, 3 - street, 4 - flash, 5 - full house, 6 - quad, 7 - street flash

				al_res := [][]int{}

				for id, el := range g.players {
					if !el.active {
						continue
					}

					mx := []int{}
					t := append([]Card{el.cards[0], el.cards[1]}, al_cards...)
					sort.Slice(t, func(i, j int) bool {
						return t[i].rank <= t[j].rank
					})

					for i := 0; i < len(t); i++ {
						for j := i + 1; j < len(t); j++ {

							rs := []int{}
							ms := []int{}

							for k, e := range t {
								if k != i && k != j {
									rs = append(rs, e.rank)
									ms = append(ms, e.suit)
								}
							}

							cur := []int{0, max_ar(rs)}

							// flashes
							if max_ar(ms) == min_ar(ms) {
								if rs[1]-rs[0] == 1 && rs[2]-rs[1] == 1 && rs[3]-rs[2] == 1 && rs[4]-rs[3] == 1 {
									cur = []int{7, rs[4]}
								} else {
									cur = []int{4, rs[4]}
								}
							}

							// quads
							if max_ar(rs[:4]) == min_ar(rs[:4]) {
								if less(cur, []int{6, 0, rs[0], rs[4]}) {
									cur = []int{6, 0, rs[0], rs[4]}
								}
							}
							if max_ar(rs[1:]) == min_ar(rs[1:]) {
								if less(cur, []int{6, 0, rs[4], rs[0]}) {
									cur = []int{6, 0, rs[4], rs[0]}
								}
							}

							// triples + full house
							if max_ar(rs[:3]) == min_ar(rs[:3]) {
								if rs[3] == rs[4] {
									if less(cur, []int{5, rs[0], rs[4]}) {
										cur = []int{5, rs[0], rs[4]}
									}
								} else {
									if less(cur, []int{2, 0, 0, rs[0], rs[4], rs[3]}) {
										cur = []int{2, 0, 0, rs[0], rs[4], rs[3]}
									}
								}
							}
							if max_ar(rs[1:4]) == min_ar(rs[1:4]) {
								if less(cur, []int{2, 0, 0, rs[1], rs[4], rs[0]}) {
									cur = []int{2, 0, 0, rs[1], rs[4], rs[0]}
								}
							}
							if max_ar(rs[2:]) == min_ar(rs[2:]) {
								if rs[0] == rs[1] {
									if less(cur, []int{5, rs[2], rs[0]}) {
										cur = []int{5, rs[2], rs[0]}
									}
								} else {
									if less(cur, []int{2, 0, 0, rs[2], rs[1], rs[0]}) {
										cur = []int{2, 0, 0, rs[2], rs[1], rs[0]}
									}
								}
							}

							// street
							if rs[1]-rs[0] == 1 && rs[2]-rs[1] == 1 && rs[3]-rs[2] == 1 && rs[4]-rs[3] == 1 {
								if less(cur, []int{3, rs[4]}) {
									cur = []int{3, rs[4]}
								}
							}

							// pair
							if rs[0] == rs[1] {
								if rs[2] == rs[3] {
									if less(cur, []int{2, 2, 0, rs[3], rs[1], rs[4]}) {
										cur = []int{2, 2, 0, rs[3], rs[1], rs[4]}
									}
								} else if rs[3] == rs[4] {
									if less(cur, []int{2, 2, 0, rs[4], rs[1], rs[2]}) {
										cur = []int{2, 2, 0, rs[4], rs[1], rs[2]}
									}
								} else {
									if less(cur, []int{2, 0, 0, 0, rs[1], rs[4], rs[3], rs[2]}) {
										cur = []int{2, 0, 0, 0, rs[1], rs[4], rs[3], rs[2]}
									}
								}
							}
							if rs[1] == rs[2] {
								if rs[3] == rs[4] {
									if less(cur, []int{2, 2, 0, rs[4], rs[2], rs[0]}) {
										cur = []int{2, 2, 0, rs[4], rs[2], rs[0]}
									}
								} else {
									if less(cur, []int{2, 0, 0, 0, rs[1], rs[4], rs[3], rs[0]}) {
										cur = []int{2, 0, 0, 0, rs[1], rs[4], rs[3], rs[0]}
									}
								}
							}
							if rs[2] == rs[3] {
								if less(cur, []int{2, 0, 0, 0, rs[3], rs[4], rs[1], rs[0]}) {
									cur = []int{2, 0, 0, 0, rs[3], rs[4], rs[1], rs[0]}
								}
							}
							if rs[3] == rs[4] {
								if less(cur, []int{2, 0, 0, 0, rs[3], rs[2], rs[1], rs[0]}) {
									cur = []int{2, 0, 0, 0, rs[3], rs[2], rs[1], rs[0]}
								}
							}

							if less(mx, cur) {
								mx = make([]int, len(cur))
								copy(mx, cur)
							}
						}
					}

					al_res = append(al_res, append([]int{id}, mx...))
				}

				sort.Slice(al_res, func(i, j int) bool {
					return less(al_res[i][1:], al_res[j][1:])
				})

				if len(al_res) > 1 && eq(al_res[len(al_res)-1][1:], al_res[len(al_res)-2][1:]) {
					g.moves <- Message{Act: "finish", Value: "draw"}
				} else {
					g.moves <- Message{Act: "finish", Value: fmt.Sprint(al_res[len(al_res)-1][0])}
				}
			}()
		case "distr":

			g.players[cl.UserId].client.messages <- cl
		case "make_bid":

			g.players[cl.UserId].client.messages <- cl
		case "new_turn":

			// for el := range g.players {
			// 	g.players[el].client.messages <- cl
			// }
		case "bid":

			val, _ := strconv.Atoi(cl.Value)
			bids <- val
		case "add_card":

			for _, el := range g.players {
				el.client.messages <- cl
			}
		case "finish":

			if cl.Value == "draw" {
				for _, el := range g.players {
					el.client.messages <- Message{Act: "finish", Value: "draw"}
				}
			} else {
				x, _ := strconv.Atoi(cl.Value)

				for id, el := range g.players {
					if id == x {
						el.client.messages <- Message{Act: "finish", Value: "win"}
					} else {
						el.client.messages <- Message{Act: "finish", Value: "lose"}
					}
				}
			}
			alive = false
		}
	}
}
