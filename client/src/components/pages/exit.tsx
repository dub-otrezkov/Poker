import { useCookies } from "react-cookie";

export default function Exit() {
    let [user, setUser] = useCookies(["user"])

    setUser("user", "");

    document.location.href = '/';

    return (
        <></>
    )
}