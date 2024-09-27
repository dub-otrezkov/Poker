import React, {useEffect, useMemo, useState} from "react";
import { useCookies } from "react-cookie";
import { API_URL, WS_URL } from "../../../constants/main";
import Card from "./cards/cardRenderer";

type Message = {
    action: string,
    value: string,
}

type Player = {
    id: number,
    status: boolean,
    bal: number,
    cur_bid: number,
}

function PlayerComp({p} : {p: Player}) {
    // false - folded
    // true - active
    if (p.status) {
        return (
            <div style={{display: "inline-block"}}>
                <p>{p.id}</p>
                <p>ставка: {p.cur_bid}</p>
                <p>баланс: {p.bal}</p>
            </div>
        )
    } else {
        return (
            <div style={{display: "inline-block"}}>
                <p>{p.id}</p>
                <p>покинул игру</p>
                <p>баланс: {p.bal}</p>
            </div>
        )
    }
}

let ws: WebSocket | null = null;

export default function GamePage(props: Map<string, string>) {

    let id = parseInt((props.get("id") || "0"));
    let [st, setSt] = useState<Array<Message>>([]);

    let [players, setPlayers] = useState<Array<number>>([]);

    let [userId, setUserId] = useCookies(["userId"])
    let [isStarted, setIsStarted] = useState<boolean>(false);
    let [cards, setCards] = useState<Array<() => React.ReactNode>>([() => (<></>)])
    let [open, setOpen] = useState<Array<() => React.ReactNode>>([])
    let [bid, setBid] = useState<{show: Boolean, bid: number}>({show: false, bid: 0})
    let [playersInfo, setPlayersInfo] = useState<Array<Player>>([]);

    let [balance, setBalance] = useState<number>(0);

    let upd = () => {
        if (st.length == 0) {
            return;
        }

        console.log(`rendered`)

        let s = st.length;

        st.forEach(m => {
        console.log(`::: ${m.action} ${m.value}`);

        switch (m.action) {
            case "start":

                let np: Array<Player> = [];
                players.forEach(el => {
                    np.push({id: el, status: true, bal: 5000, cur_bid: 0} as Player);
                })
                setPlayersInfo(np);
                setIsStarted(true);
                break
            case "enter":
                
                setPlayers(tp => {
                    if (tp.indexOf(parseInt(m.value)) == -1) {
                        tp.push(parseInt(m.value));
                    }
                    return tp;
                });
                setIsStarted(false);
                break
            case "left":

                setIsStarted(false);
                setPlayers(players => {
                    let nw: Array<number> = [];
                    for (let i = 0; i < players.length; i++) {
                        if (players[i] != parseInt(m.value)) {
                            nw.push(players[i])
                        }
                    }
                    return nw;
                });
                break
            case "distr":

                let [v1, c1, v2, c2] = m.value.split(" ");
                setCards([() => Card({v: parseInt(v1), c: parseInt(c1)}), () => Card({v: parseInt(v2), c: parseInt(c2)})])
                break;
            case "make_bid":

                if (m.value == "allin") {
                    setBid({show: true, bid: -1});
                } else {
                    setBid({show: true, bid: parseInt(m.value)});
                }
                break;
            case "add_card":

                let [t1, g1] = m.value.split(" ");
                setOpen(open => [...open, () => Card({v: parseInt(t1), c: parseInt(g1)})]);
                for (let i = 0; i < playersInfo.length; i++) {
                    setPlayersInfo(pl => {
                        pl[i].cur_bid = 0;
                        return pl;
                    });
                }
                break;
            case "new_bid":

                let [uid, bd] = m.value.split(' ').map(el => parseInt(el));
                setBalance(bal => bal + bd);
                setPlayersInfo(prev => {
                    prev.forEach(el => {
                        if (el.id == uid) {
                            el.bal -= bd;
                            el.cur_bid = Math.max(el.cur_bid, bd);
                        }
                    });

                    return prev;
                });
            }
        });

        setSt(st => st.slice(s));
    };

    useEffect(() => {
        let tU: Array<number> = players.slice();

        (async () => {
            

            await fetch(`${API_URL}/getRoomMembers/${id}`)
            .then(resp => {
                if (resp.ok) return resp.json();
                else return {"users": []};
            })
            .then(resp => {
                if (tU.indexOf(userId.userId) == -1) {
                    tU.push(userId.userId)
                }
                // console.log("...." + String(resp["users"]) + String(players));
                for (let i = 0; i < resp["users"].length; i++) {
                    if (tU.indexOf(resp["users"][i]) == -1) {
                        tU.push(resp["users"][i]);
                    }
                }
                let tp = tU.slice();
                setPlayers(tp);
            })

            ws = new WebSocket(`${WS_URL}/enterRoom/${localStorage.getItem("wslink") || ""}`);

            if (ws === null || !ws.OPEN) {
                window.location.replace("/");
                return
            }

            ws.onmessage = (e: MessageEvent) => {
                let m: Message = JSON.parse(e.data);
                // setSt([...st, m]);
                console.log(`got message: ${m.action}`);
                setSt(st => [...st, m]);
                // upd(m);
            }
        })()

        // alert(players);
    }, [])

    useEffect(upd, [st])

    console.log("\\\\" + String(players));

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
                        action: "ready",
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
                            <h3>
                                Банк: {balance}
                            </h3>
                        </div>

                        <div>
                            {playersInfo.map(elem => (
                                <PlayerComp p={elem} />
                            ))}
                        </div>

                        <div> 
                            <h3>Открытые карты</h3>
                            <>{open.map(elem => elem())}</>
                        </div>

                        <div>
                            <button onClick={() => {setVis(!vis)}}>показать карты</button>
                                <br />
                            <>{cards.map(elem => (vis ? elem():() => (<></>)))}</>
                        </div>


                        {(() => {
                            if (!bid.show) return (<></>)
                            if (bid.bid < 0) {
                                return (
                                    <div>
                                        <button onClick={() => {
                                            ws?.send(JSON.stringify({
                                                action: "bid", 
                                                value: "-1",
                                                type: "game"
                                            }));
                                            setBid({show: false, bid: 0});

                                        }}>
                                            All-in
                                        </button>
                                            
                                        <button onClick={() => {
                                            ws?.send(JSON.stringify({
                                                action: "bid", 
                                                value: "0",
                                                type: "game"
                                            }));
                                            setBid({show: false, bid: 0});
                                        }}>сложить карты</button>
                                    </div>
                                    
                                )
                            } else {
                                return (
                                    <div>
                                        <input type="number" max={bid.bid} id="bid_value"/>
                                        <button onClick={() => {
                                            let t = (document.getElementById("bid_value") as HTMLInputElement).value;

                                            if (t == "") {
                                                alert("введите размер ставки");
                                                return;
                                            }

                                            setBid({show: false, bid: 0});
                                            ws?.send(JSON.stringify({
                                                action: "bid",
                                                value: t,
                                                type: "game"
                                            }))
                                        }}>подтвердить</button>

                                        <br />
                                        
                                        <button onClick={() => {
                                            ws?.send(JSON.stringify({
                                                action: "bid", 
                                                value: "0",
                                                type: "game"
                                            }));
                                            setBid({show: false, bid: 0});
                                        }}>сложить карты</button>
                                    </div>
                                    
                                )
                            }
                        })()}
                    </>
                )
            })(isStarted)}
        </div>
    )
}