import React from "react";
import { MWF } from './middlewares'


interface El {
    path: String
    page: (...props: any) => JSX.Element
    mws?: Array<MWF>,
}

export const Route = function({path, page, mws}: El): JSX.Element | null {
    let params = new Map<string, string>();

    let dpath = document.location.pathname;


    let ar1: Array<string> = path.split('/'), ar2: Array<string> = dpath.split('/');

    if (ar1.length != ar2.length) {
        return null;
    }

    for (let i = 0; i < ar1.length; i++) {
        if (ar1[i] != ar2[i]) {
            if (ar1[i].length > 0 && ar1[i][0] == ':') {
                params.set(ar1[i].substring(1), ar2[i]); 
            } else {
                return null;
            }
        }
    }

    let r: MWF = () => {
        return (
            <>
                {page(params)}
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
