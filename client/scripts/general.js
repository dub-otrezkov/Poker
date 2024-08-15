var General = {

    GetCookie: function (req) {
        let res = "";
        
        document.cookie.split("; ").map(cookie => {
            let [name, val] = cookie.split("=");

            if (name == req) {
                res = val;
            }
        });

        return res;
    }
}

export default General