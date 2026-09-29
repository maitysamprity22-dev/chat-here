"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setUsername(localStorage.getItem("username") || "");

        const token = localStorage.getItem("token");
        if (!token) return;

        let activeRequest: AbortController | null = null;

        function checkUnread() {
            activeRequest?.abort();
            activeRequest = new AbortController();
            const since =
                localStorage.getItem("dmLastSeen") || new Date(0).toISOString();
            fetch(
                `https://chatapp.adnecto.in/api/dm/count?since=${encodeURIComponent(
                    since
                )}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: activeRequest.signal,
                }
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
        window.addEventListener("dm:read", checkUnread);
        const intervalId = setInterval(checkUnread, 5000);
        return () => {
            clearInterval(intervalId);
            window.removeEventListener("dm:read", checkUnread);
            activeRequest?.abort();
        };
    }, [pathname]);

    const isRoomsActive = pathname?.startsWith("/rooms");
    const isDmActive = pathname?.startsWith("/dm");
    const isBlockedActive = pathname?.startsWith("/blocked");

    return (
        <header className="site-header">
            <div className="brand-lockup">
                <BrandMark />
                <span className="brand-name">ChitChat</span>
            </div>
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



                <button
                    onClick={() => router.push("/blocked")}
                    className={`nav-button ${isBlockedActive ? "nav-button--active" : ""}`}
                >
                    <span aria-hidden="true">⊘</span>
                    Blocked
                </button>
            </nav>

            <span className="user-chip" title={username}>{username || "Guest"}</span>
        </header>
    );
}