import { useState } from "react";
import { useCookies } from "react-cookie";

export default function Exit() {


    let [user, setUser] = useCookies(["user"]);
    let [userId, setUserId] = useCookies(["userId"]);


    setUser("user", "");
    setUserId("userId", -1)

    document.location.href = '/';

    return (
        <>
        </>
    )
}