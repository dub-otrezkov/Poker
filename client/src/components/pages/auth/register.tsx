import React, { FormEvent, useContext, useState } from "react";
import { useCookies } from "react-cookie";
import { API_URL } from "../../../constants/main";
function Register() {
    let [ user, setUser ] = useCookies(["user"])
    let [ userId, setUserId ] = useCookies(["userId"])

    let [err, setErr] = useState("")

    async function onsub(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        let d = new FormData(e.currentTarget);

        let login = d.get("login")?.toString(), password = d.get("password")?.toString();


        if (password !== undefined) {
            if (!(/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(password))) {
                password = "";
                setErr("в пароле должна быть хотя одна буква и одна цифра");
            }
        }

        if (login !== undefined && login.length > 0 && password !== undefined && password.length > 0) {
            
            fetch(`${API_URL}/register`, {
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
            .then(async resp => {
                if (resp.ok) {
                let r = await resp.json();
                setUser("user", login);

                setUserId("userId", r["id"]);

                console.log(r);

                document.location.href = "/";
            } else {
                setErr("неправильный логин или пароль");
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