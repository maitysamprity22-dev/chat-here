"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

type DMConversation = {
    username: string;
    last_message: {
        body: string;
        sender: string;
        created_at: string;
    };
};

export default function DMListPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [conversations, setConversations] = useState<DMConversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }
        setChecking(false);
        fetchConversations(token);
    }, [router]);

    async function fetchConversations(token: string) {
        setLoading(true);
        const response = await fetch("https://chatapp.adnecto.in/api/dm", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        setConversations(result.data);
        setLoading(false);
        localStorage.setItem("dmLastSeen", new Date().toISOString());
    }

    if (checking) {
        return null;
    }

    return (
        <div className="app-shell">
            <Header />
            <main className="page-frame">

                <div className="page-heading flex items-start justify-between gap-4">
                    <div>
                        <h1>Direct Messages</h1>
                        <p>Your conversations</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/rooms")}
                    className="back-link"
                >
                    ← Rooms
                </button>

                {loading && <p className="empty-state">Loading conversations...</p>}

                {!loading && conversations?.length === 0 && (
                    <p className="empty-state">
                        No conversations yet. Message someone by going to{" "}
                        <span className="text-amber-200">/dm/their-username</span>.
                    </p>
                )}

                <ul className="list">
                    {conversations?.map((conv) => (
                        <li
                            key={conv.username}
                            onClick={() => router.push(`/dm/${conv.username}`)}
                            className="list-item list-item--interactive"
                        >
                            <div className="mb-1 flex items-center gap-3">
                                <span className="status-dot" />
                                <span className="list-title">
                                    {conv.username}
                                </span>
                            </div>
                            <p className="list-preview">
                                {conv.last_message.sender}: {conv.last_message.body}
                            </p>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}