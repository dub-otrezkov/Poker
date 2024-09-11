import React from "react";
import { useCookies } from "react-cookie";

export default function CreateGameButton() {
    let [userId, setUserId] = useCookies(["userId"])

    let create = function() {
        if (userId.userId < 0) {
            alert("нужна авторизация");
            return;
        }

        fetch(`http://localhost:52/createRoom`, {
            method: "POST",
            mode: "cors",
            headers: {
                Accept: 'application/json',
            },
            body: JSON.stringify({
                userId: userId.userId,
            })
        })
        .then(resp => {
            if (resp.ok) return resp.json();
            else return {"id": -1}
        })
        .then(async resp => {
            if (resp["id"] === undefined || resp["id"] == -1) {
                alert("уже создал игру");
            } else {
                alert("создал игру");

                localStorage.setItem("wslink", `${resp["id"]}/${userId.userId}`);

                window.location.replace(`http://localhost:3000/game/${resp["id"]}`);
            }
        })
    }

    return (
        <button onClick={create}>
            создать игру
        </button>
    )
}