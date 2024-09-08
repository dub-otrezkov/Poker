import React, { useState } from "react";
import AuthInfo from "./auth/authinfo"
import CreateGameButton from "./gameProcess/createGameButton";


function MainPage() {
    return (
        <>
            <AuthInfo />
            <h1>
                элитный покер
            </h1>

            <CreateGameButton/>
            <br/>

            <button onClick={() => {window.location.replace("/getGame")}}>найти игру</button>
        </>
        
    );
}

export default MainPage