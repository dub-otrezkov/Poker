import React, { FormEvent, useContext, useState } from "react";
import { useCookies } from "react-cookie";
import { redirect } from "react-router-dom";

function Login() {
    let [ user, setUser ] = useCookies(["user"])

    let [err, setErr] = useState("")

    async function onsub(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        let d = new FormData(e.currentTarget);

        let login = d.get("login")?.toString(), password = d.get("password")?.toString();

        if (login !== undefined && login.length > 0 && password !== undefined && password.length > 0) {
            fetch(`http://localhost:52/login`, {
                method: "POST",
                mode: "cors",
                headers: {
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    login: login,
                    password: password,
                })
            })
            .then(resp => {
                if (resp.ok) return null;
                else return resp.json();
            })
            .then(resp => {
                if (resp === null) {
                    setUser("user", login);

                    return document.location.href = "/";
                } else {
                    setErr("неправильный логин или пароль");
                }
            })
        }
    }

    return (
        <div>
            <form onSubmit={onsub}>
                <input name="login"></input>
                <label htmlFor="login">логин</label>
                <br />

                <input name="password"></input>
                <label htmlFor="password">пароль</label>
                <br />

                <p>
                    {err}
                </p>

                <button type="submit">войти</button>
            </form>
        </div>
    )
}

export default Login    