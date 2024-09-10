import React, { useState } from "react";
import diamond from "./images/diamond.png"
import heart from "./images/heart.png"
import krest from "./images/krest.png"
import pika from "./images/pika.png"

const ranks = [
    -1,
    -1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    "J",
    "Q",
    "K",
    "A"
];

const col = [
    diamond,
    heart,
    krest,
    pika
]

export default function Card({v, c}: {v: number, c: number}) {
    return (
        <div style={{width: "fit-content", padding: "10px", margin: "10px 10px 10px 0px", backgroundColor: "white", display: "inline-block"}}>
            <h1>{ranks[v]}</h1>
            <img src={col[c]} width={40} height={40}/>
        </div>
    )
}