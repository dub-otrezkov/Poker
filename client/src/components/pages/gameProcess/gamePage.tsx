import React, {useContext, useEffect, useState} from "react";
import { useCookies } from "react-cookie";
import { API_URL, WS_URL } from "../../../constants/main";

type Message = {
    action: string,
    userId: string,
    roomId: string,
    value: string,
}

export default function GamePage(props: Map<string, string>) {

    let [ws, wsSet] = useState<WebSocket | null>(null)

    if (ws === null) {
        wsSet(new WebSocket(`${WS_URL}/enterRoom/${localStorage.getItem("wslink") || ""}`))
    }

    const [st, setSt] = useState<Array<any>>([]);

    let id = parseInt((props.get("id") || "0"))

    const [players, setPlayers] = useState<Array<number>>([]);

    let [userId, setUserId] = useCookies(["userId"])

    let [isStarted, setIsStarted] = useState<boolean>(false);

    useEffect(() => {
        

        if (ws === null || !ws.OPEN) {
            alert("err");
            window.location.replace("/");
            return
        }

        fetch(`${API_URL}/getRoomMembers/${id}`)
        .then(resp => {
            if (resp.ok) return resp.json();
            else return {"users": []};
        })
        .then(resp => {
            let lst: Array<number> = resp["users"];
            setPlayers(lst);
        })

        ws.onmessage = (e: MessageEvent) => {
            let m: Message = JSON.parse(e.data);
            setSt([...st, m.value])

            switch (m.action) {
                case "start":
                    setIsStarted(true);
                    break
                case "left":
                    setIsStarted(false);
                    break
            }
        }
    }, [st])

    return (
        <>
            <a className="big_link" href="/">назад</a>
            <p>комната №{id}</p>
            <h3>в игре сейчас пользователи: {players.map((elem) => (
                    <>{elem}, </>
                ))}
            </h3>
            
            <br/>

            <h1>игра</h1>
            {st.map((elem) => (
                <p>{elem}</p>
            ))}

            <button onClick={
                () => {
                    if (ws === null) return;
                    if (isStarted) return;

                    ws.send(JSON.stringify({
                        userId: userId.userId,
                        action: "ready",
                        roomId: id,
                        value: "",
                    }));
                }
            }>
                готов
            </button>
        </>
    )
}