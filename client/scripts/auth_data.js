import General from './general.js'

var UserData = {
    getUserInfoHeader: function() {
        let user = General.GetCookie("user");
        let res = document.createElement("div")
        if (user == "") {
            res.innerHTML = `
                <p>не авторизован</p>
                <p><a href="/login">войти</a>/<a href="/register">зарегистрироваться</a></p>
            `;

            return res;
        } else {
            let f = document.createElement("form");

            let p = document.createElement("p");
            p.innerText = user;

            let btn = document.createElement("button");
            btn.type = "submit";

            
            btn.innerText = "выйти";

            f.append(p, btn);

            f.addEventListener("submit", e => {
                e.preventDefault();

                fetch(`/exit`, {
                    method: "POST",
                })
                .then(resp => {
                    if (resp.ok) document.location.href = "/";
                    else alert("не получилось выйти из системы, попробуйте снова через некоторое время");
                })
            })

            res.append(f)

            return res;
        }
    }
}

export default UserData