package db

import (
	"fmt"
)

func (db *Database) CreateGame(user int) (int, error) {

	db.db.Exec(fmt.Sprintf("delete from `Players` where userId=%v", user))
	db.db.Exec(fmt.Sprintf("delete from `Sessions` where owner=%v", user))

	t, err := db.db.Exec(fmt.Sprintf("insert into `Sessions` (`status`, `owner`) values (%v, %v)", 1, user))
	if err != nil {
		return 0, err
	}

	x, _ := t.LastInsertId()

	return int(x), nil
}

func (db *Database) GetGames(user int) []int {

	cn, _ := db.db.Query(fmt.Sprintf("select `id` from `Sessions` where owner!=%v", user))

	res := make([]int, 0)

	for cn.Next() {
		res = append(res, 0)
		cn.Scan(&res[len(res)-1])
	}

	fmt.Println(res)

	return res[max(0, len(res)-100):]
}

func (db *Database) EnterGame(user, sessionId int) error {
	_, err := db.db.Exec(fmt.Sprintf("insert into `Players` (userId, sessionId) VALUES (%v, %v)", user, sessionId))
	return err
}

func (db *Database) LeaveGame(user, sessionId int) error {
	_, err := db.db.Exec(fmt.Sprintf("delete from `Players` where userId=%v and sessionId=%v", user, sessionId))
	return err
}
