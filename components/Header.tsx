"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setUsername(localStorage.getItem("username") || "");

        const token = localStorage.getItem("token");
        if (!token) return;

        function checkUnread() {
            const since =
                localStorage.getItem("dmLastSeen") || new Date(0).toISOString();
            fetch(
                `https://chatapp.adnecto.in/api/dm/count?since=${encodeURIComponent(
                    since
                )}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
                .then((res) => res.json())
                .then((result) => {
                    if (result?.data?.count !== undefined) {
                        setUnreadCount(result.data.count);
                    }
                })
                .catch(() => { });
        }

        checkUnread();
        const intervalId = setInterval(checkUnread, 5000);
        return () => clearInterval(intervalId);
    }, [pathname]);

    const isRoomsActive = pathname?.startsWith("/rooms");
    const isDmActive = pathname?.startsWith("/dm");

    return (
        <header className="site-header">
            <div className="brand-lockup">
                <span className="brand-mark text-blue-600" aria-hidden="true" />
                <span className="brand-name"></span>
                <nav className="header-nav" aria-label="Primary navigation">
                    <button
                        onClick={() => router.push("/rooms")}
                        className={`nav-button ${isRoomsActive ? "nav-button--active" : ""}`}
                    >
                        <span aria-hidden="true">◈</span>
                        Rooms
                    </button>

                    <button
                        onClick={() => router.push("/dm")}
                        className={`nav-button ${isDmActive ? "nav-button--active" : ""}`}
                    >
                        <span aria-hidden="true">◇</span>
                        DMs
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            <span className="user-chip" title={username}>{username || "Guest"}</span>
        </header>
    );
}