import React, { FormEvent, useContext, useState } from "react";
import { useCookies } from "react-cookie";

function Register() {
    let [ userName, setUserName ] = useCookies(["user"])

    let [err, setErr] = useState("")

    async function onsub(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        let d = new FormData(e.currentTarget);

        let login = d.get("login")?.toString(), password = d.get("password")?.toString();


        if (password !== undefined) {
            if (!(/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(password))) {
                password = "";
                err = "в пароле должна быть хотя одна буква и одна цифра";
            }
        }

        if (login !== undefined && login.length > 0 && password !== undefined && password.length > 0) {
            
            fetch(`http://localhost:52/register`, {
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
                else return resp.text();
            })
            .then(resp => {
                console.log(resp);

                if (resp === null) {
                    setUserName("user", login);

                    document.location.href = "/";
                } else {
                    err = resp;
                }
            })

            
        }
    }

    return (
        <div>
            <h1>
                регистрация
            </h1>
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

                <button type="submit">зарегистрироваться</button>
            </form>
        </div>
    )
}

export default Register    