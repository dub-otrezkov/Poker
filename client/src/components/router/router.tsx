import React from "react";
import { MWF } from './middlewares'


interface El {
    path: String
    page: JSX.Element
    mws?: Array<MWF>,
}

export const Route = function({path, page, mws}: El): JSX.Element | null {
    if (path != document.location.pathname) {
        return null;
    }

    let r: MWF = () => {
        return (
            <>
                {page}
            </>
        )
    };

    if (mws !== undefined) {
        for (let i = mws.length - 1; i >= 0; i--) {
            r = mws[i](r);
        }
    }

    return r();
}