import React from "react";
import { useCookies } from "react-cookie";


export default function AuthInfo() {
    let [userName, setUserName] = useCookies(["user"])
    
    if (userName.user == "" || userName.user === undefined) {
        return (
            <div>
                <p>не вошли в приложение</p>
                <p><a href="/login">войти</a>/<a href="/register">зарегистрироваться</a></p>
            </div>
        )
    } else {
        return (
            <div>
                <p>{userName.user}</p>
                <a href="/exit">выйти</a>
            </div>
        )
    }
}