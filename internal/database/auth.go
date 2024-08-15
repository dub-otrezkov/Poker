package db

import "fmt"

type AuthDBErr struct {
	text string
}

func (err AuthDBErr) Error() string {
	return err.text
}

func (d *Database) GetUser(login string) (map[string]interface{}, error) {

	res, err := d.db.Query(fmt.Sprintf("select `id`, `password` from `Users` where `login`='%v'", login))
	if err != nil {
		return nil, err
	}
	defer res.Close()

	if res.Next() {
		id := 0
		pswd := ""

		err := res.Scan(&id, &pswd)

		return map[string]interface{}{"id": id, "password": pswd}, err
	} else {
		return nil, AuthDBErr{"requested user doesn't exist"}
	}
}

func (d *Database) RegisterUser(login string, password string) error {

	if _, err := d.GetUser(login); err == nil {

		return AuthDBErr{"user already exists"}
	}

	_, err := d.db.Exec(fmt.Sprintf("insert into `Users` (`login`, `password`) values ('%v', '%v')", login, password))

	fmt.Println(err)

	return err
}
