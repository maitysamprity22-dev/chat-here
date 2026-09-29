"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

type BlockedUser = {
    username: string;
    blocked_at: string;
};

export default function BlockedPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [blocked, setBlocked] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }
        setChecking(false);
        fetchBlocked(token);
    }, [router]);

    async function fetchBlocked(token: string) {
        setLoading(true);
        const response = await fetch("https://chatapp.adnecto.in/api/blocks", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        setBlocked(result.data);
        setLoading(false);
    }

    async function handleUnblock(username: string) {
        const token = localStorage.getItem("token");
        const response = await fetch(
            `https://chatapp.adnecto.in/api/blocks/${username}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) return;

        setBlocked((prev) => prev.filter((b) => b.username !== username));
    }

    if (checking) {
        return null;
    }

    return (
        <div className="app-shell">
            <Header />
            <main className="page-frame">
                <button onClick={() => router.push("/dm")} className="back-link">
                    ← Direct messages
                </button>
                <div className="page-heading">
                    <h1>Blocked users</h1>
                    <p>You won't see messages from these people anywhere.</p>
                </div>

                {loading && <p className="empty-state">Loading blocked users...</p>}

                {!loading && blocked.length === 0 && (
                    <p className="empty-state">You haven't blocked anyone.</p>
                )}

                <ul className="list">
                    {blocked.map((b) => (
                        <li
                            key={b.username}
                            className="list-item"
                        >
                            <span className="list-title">{b.username}</span>
                            <button
                                onClick={() => handleUnblock(b.username)}
                                className="button button--primary"
                            >
                                Unblock
                            </button>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}