import React, {useContext, useEffect, useMemo, useState} from "react";
import { useCookies } from "react-cookie";
import { API_URL, WS_URL } from "../../../constants/main";
import Card from "./cards/cardRenderer";

type Message = {
    action: string,
    value: string,
}

export default function GamePage(props: Map<string, string>) {

    let [ws, wsSet] = useState<WebSocket | null>(null)

    if (ws === null) {
        wsSet(new WebSocket(`${WS_URL}/enterRoom/${localStorage.getItem("wslink") || ""}`))
    }

    let id = parseInt((props.get("id") || "0"))

    const [st, setSt] = useState<Array<any>>([]);
    const [players, setPlayers] = useState<Array<number>>([]);
    let [userId, setUserId] = useCookies(["userId"])
    let [isStarted, setIsStarted] = useState<boolean>(false);
    let [cards, setCards] = useState<Array<() => React.ReactNode>>([() => (<>jjjj</>)])
    let [bid, setBid] = useState<{show: Boolean, bid: number}>({show: false, bid: 0})

    useEffect(() => {
        if (ws === null || !ws.OPEN) {
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
            case "enter":
                setIsStarted(false);
                let cp = players;
                if (cp.indexOf(parseInt(m.value)) == -1) {
                    cp.push(parseInt(m.value))
                }
                setPlayers(cp);
                break
            case "left":
                setIsStarted(false);
                let nw: Array<number> = [];
                for (let i = 0; i < players.length; i++) {
                    if (players[i] != parseInt(m.value)) {
                        nw.push(players[i])
                    }
                }
                setPlayers(nw);
                break
            case "distr":
                let [v1, c1, v2, c2] = m.value.split(" ");
                setCards([() => Card({v: parseInt(v1), c: parseInt(c1)}), () => Card({v: parseInt(v2), c: parseInt(c2)})])
                break;
            case "make_bid":
                if (m.value == "allin") {

                }
                break;
            }
        }
    }, [])

    
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


                        {(() => {
                            if (!bid.show) return (<></>)
                            if (bid.bid < 0) {
                                return (
                                    <button onClick={() => {
                                        ws?.send(JSON.stringify({action: "bid", value: toString()}))
                                    }}>
                                        All-in
                                    </button>
                                )
                            }
                        })()}
                    </>
                )
            })(isStarted)}
        </div>
    )
}