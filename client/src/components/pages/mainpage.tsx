import React from "react";
import { useCookies } from "react-cookie";
import AuthInfo from "../blocks/authinfo"

function MainPage() {
    let userName = useCookies(["user"])

    return (
        <>
            <AuthInfo />
            <h1>
                шахматы
            </h1>
        </>
        
    );
}

export default MainPage