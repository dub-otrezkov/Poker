import React from "react";
import { useCookies } from "react-cookie";
import { useState } from "react";

export default function GameListPage() {
    let [userId, setUserId] = useCookies(["userId"]);

    
    let [list, setList] = useState(Array<number>(0));

    let update = () => {
        fetch(`http://localhost:52/getRooms`, {
            method: "GET",
        })
        .then(resp => {
            if (resp.ok) return resp.json();
            else return [];
        })
        .then(resp => {
            let lst: Array<number> = resp["lst"];

            setList(lst);
        })
    }

    return (
        <>
            <a className="big_link" href="/">назад</a>
            <h1>
                список игр
            </h1>
            <br></br>
            {list.map(elem => (<button className="big_link" onClick={()=>{
                localStorage.setItem("wslink", `${elem}/${userId.userId}`);

                window.location.replace(`http://localhost:3000/game/${elem}`);
            }
            }>{`${elem}`}</button>))}

            <button onClick={update}>обновить</button>

            <br />
        </>
    )
}