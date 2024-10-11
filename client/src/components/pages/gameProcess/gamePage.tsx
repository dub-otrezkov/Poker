import React, { useEffect, useMemo, useState } from "react";
import { useCookies } from "react-cookie";
import { API_URL, WS_URL } from "../../../constants/main";
import Card from "./cards/cardRenderer";
import { parse } from "path";

type JSONMap = string | Map<string, JSONMap>

function toJSONMap(current: any): JSONMap {
    if (typeof(current) === 'string') {
        return current;
    } else if (typeof(current) === 'object' && current !== null) {
        const result = new Map<string, JSONMap>();
        for (const [key, value] of Object.entries(current)) {
            result.set(key, toJSONMap(value));
        }
        return result;
    }
    return "";
}

type Message = {
    action: string,
    value: JSONMap,
}

type Player = {
    id: number,
    status: boolean,
    bal: number,
    cur_bid: number,
}

function PlayerComp({ p }: { p: Player }) {
    // false - folded
    // true - active
    if (p.status) {
        return (
            <div style={{ display: "inline-block" }}>
                <p>{p.id}</p>
                <p>ставка: {p.cur_bid}</p>
                <p>баланс: {p.bal}</p>
            </div>
        )
    } else {
        return (
            <div style={{ display: "inline-block" }}>
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
    let [bid, setBid] = useState<{ show: Boolean, bid: number }>({ show: false, bid: 0 })
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

            let content: Map<string, JSONMap> = (m.value as Map<string, JSONMap>);
            // const content: JSONMap = new Map<string, JSONMap>(JSON.parse(m.value));

            if (content == null) {
                return;
            }
            // console.log(typeof(m.value as Map<string, JSONMap>).get("content"));
            // console.log(typeof(content as Map<string, JSONMap>));

            switch (m.action) {
                case "start":

                    let np: Array<Player> = [];
                    players.forEach(el => {
                        np.push({ id: el, status: true, bal: 5000, cur_bid: 0 } as Player);
                    })
                    setPlayersInfo(np);
                    setIsStarted(true);
                    break
                case "enter":

                    console.log(content.get("content"));

                    setPlayers(tp => {
                        if (tp.indexOf(parseInt(content.get("content") as string)) == -1) {
                            tp.push(parseInt(content.get("content") as string));
                        }
                        return tp;
                    });
                    setIsStarted(false);
                    break
                case "left":
                    setIsStarted(false);
                    setPlayers(players => {
                        let nw: Array<number> = [];
                        for (const player of players) {
                            if (player != parseInt(content.get("content") as string)) {
                                nw.push(player)
                            }
                        }
                        return nw;
                    });
                    break
                case "distr":
                    let r1 = parseInt((content.get("content") as Map<string, JSONMap>).get("rank1") as string)
                    let s1 = parseInt((content.get("content") as Map<string, JSONMap>).get("suit1") as string)
                    let r2 = parseInt((content.get("content") as Map<string, JSONMap>).get("rank2") as string)
                    let s2 = parseInt((content.get("content") as Map<string, JSONMap>).get("suit2") as string)
                
                    console.log(`${r1} ${s1} ${r2} ${s2}`);

                    setCards([() => Card({v: r1, c: s1}), () => Card({v: r2, c: s2})])
                    break;
                case "make_bid":

                    if (content.get("content") == "allin") {
                        setBid({show: true, bid: -1});
                    } else {
                        setBid({show: true, bid: parseInt(content.get("content") as string)});
                    }
                    break;
                case "add_card":

                    // console.log(content);

                    let r = parseInt(content.get("rank") as string);
                    let s = parseInt(content.get("suit") as string);
                    
                    // console.log(r, s);

                    setOpen(open => [...open, () => Card({v: r, c: s})]);
                    for (let i = 0; i < playersInfo.length; i++) {
                        setPlayersInfo(pl => {
                            pl[i].cur_bid = 0;
                            return pl;
                        });
                    }
                    break;
                case "uuinfo":

                    let uid = parseInt(content.get("uid") as string)

                    console.log(`kkkkk ${uid}`);
                    console.log(content);

                    setPlayersInfo(prev => {
                        prev.forEach(el => {
                            if (el.id == uid) {
                                if (content.has("bal")) {
                                    el.bal = parseInt(content.get("bal") as string);
                                }
                                if (content.has("cur_bid")) {
                                    el.cur_bid = parseInt(content.get("cur_bid") as string);
                                }
                            }
                        });

                        return prev;
                    });

                    // let [uid, bd] = m.value.split(' ').map(el => parseInt(el));
                    // setBalance(bal => bal + bd);
                    // setPlayersInfo(prev => {
                    //     prev.forEach(el => {
                    //         if (el.id == uid) {
                    //             el.bal -= bd;
                    //             el.cur_bid = Math.max(el.cur_bid, bd);
                    //         }
                    //     });

                    //     return prev;
                    // });
                    break;
                case "finish":

                    break;
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
                    else return { "users": [] };
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
                const parsed = JSON.parse(e.data);
    
                let m: Message = {
                    action: parsed.action,
                    value: toJSONMap(JSON.parse(parsed.value)),
                }
                // setSt([...st, m]);
                console.log(`got message: ${m.value} ${typeof m.value}`);
                console.log(m.value);
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
            <button onClick={() => { window.location.replace("/") }}>назад</button>
            <p>комната №{id}</p>
            <h3>в игре сейчас пользователи: {players.map((elem) => (
                <>{elem}, </>
            ))}
            </h3>

            <br />

            <button id={isStarted ? "inActive" : ""} onClick={
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
                            <button onClick={() => { setVis(!vis) }}>показать карты</button>
                            <br />
                            <>{cards.map(elem => (vis ? elem() : () => (<></>)))}</>
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
                                            setBid({ show: false, bid: 0 });

                                        }}>
                                            All-in
                                        </button>

                                        <button onClick={() => {
                                            ws?.send(JSON.stringify({
                                                action: "bid",
                                                value: "0",
                                                type: "game"
                                            }));
                                            setBid({ show: false, bid: 0 });
                                        }}>сложить карты</button>
                                    </div>

                                )
                            } else {
                                return (
                                    <div>
                                        <input type="number" max={bid.bid} id="bid_value" />
                                        <button onClick={() => {
                                            let t = (document.getElementById("bid_value") as HTMLInputElement).value;

                                            if (t == "") {
                                                alert("введите размер ставки");
                                                return;
                                            }

                                            setBid({ show: false, bid: 0 });
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
                                            setBid({ show: false, bid: 0 });
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