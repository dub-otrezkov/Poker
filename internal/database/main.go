package db

import (
	"database/sql"
	"os"

	"github.com/go-sql-driver/mysql"
)

type DBError struct {
	text string
}

func (a DBError) Error() string {
	return a.text
}

type Database struct {
	db *sql.DB
}

func New() (*Database, error) {
	db := &Database{}

	config := &struct {
		addr   string
		user   string
		passwd string
		bdname string
	}{}

	var exist bool
	var err error

	config.addr, exist = os.LookupEnv("bd_address")
	if !exist {
		return nil, DBError{"no address variable"}
	}
	config.user, exist = os.LookupEnv("bd_user")
	if !exist {
		return nil, DBError{"no user variable"}
	}
	config.passwd, exist = os.LookupEnv("bd_password")
	if !exist {
		return nil, DBError{"no password variable"}
	}
	config.bdname = "Chess"

	db.db, err = sql.Open("mysql", (&mysql.Config{
		User:   config.user,
		Passwd: config.passwd,
		Net:    "tcp",
		Addr:   config.addr,
		DBName: config.bdname,
	}).FormatDSN())

	return db, err
}
