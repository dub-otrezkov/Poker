import React from "react";
import { useCookies } from "react-cookie";

export type MWF = (...args: any) => (any)

export const checkAuth = function(next: MWF) {
    return () => {

        let [user, setUser] = useCookies(["user"])

        if (user.user !== undefined && user.user.length > 0) {
            return next();
        }

        return (
            <div>
                <p>необходима авторизация</p>
                <a href="/">на главную</a>
            </div>
        )
    }
}

export const checkNotAuth = function(next: MWF) {
    return () => {

        let [user, setUser] = useCookies(["user"])

        if (user.user === undefined || user.user.length == 0) {
            return next();
        }

        return (
            <div>
                <p>уже вошли как {user.user}</p>
                <a href="/">на главную</a>
            </div>
        )
    }
}