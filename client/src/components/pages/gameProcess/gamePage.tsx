import React, {useContext, useEffect, useState} from "react";
import { useCookies } from "react-cookie";
import { API_URL, WS_URL } from "../../../constants/main";
import Card from "./cards/cardRenderer";

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

    let [cards, setCards] = useState<Array<() => React.ReactNode>>([() => (<>jjjj</>)])

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
            case "~start":
                setIsStarted(true);
                break
            case "left":
                setIsStarted(false);
                break
            case "~distr":
                let [v1, c1, v2, c2] = m.value.split(" ");
                setCards([() => Card({v: parseInt(v1), c: parseInt(c1)}), () => Card({v: parseInt(v2), c: parseInt(c2)})])
                break;
            }
        }
    }, [st])

    
    let [vis, setVis] = useState<Boolean>(false);

    return (
        <div>
            <button onClick={() => {window.location.replace("/")}}>назад</button>
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

            <button id={isStarted ? "inActive":""} onClick={
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

            {((isStarted) => {
                if (!isStarted) {
                    return (
                        <>
                            <h1>игра еще не началась</h1>
                        </>
                    )
                }
                return (
                    <>
                        <h1>игра началась</h1>

                        <div>
                            <button onClick={() => {setVis(!vis)}}>показать карты</button>
                                <br />
                            <>{cards.map(elem => (vis ? elem():() => (<></>)))}</>
                        </div>


                    </>
                )
            })(isStarted)}
        </div>
    )
}