"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";

type Message = {
    id: number;
    sender: string;
    room_id: number | null;
    recipient: string | null;
    body: string;
    created_at: string;
};

export default function DMThreadPage() {
    const router = useRouter();
    const params = useParams();
    const username = params.username;

    const [checking, setChecking] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [currentUsername, setCurrentUsername] = useState("");

    const lastTimestampRef = useRef<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }
        setChecking(false);
        setCurrentUsername(localStorage.getItem("username") || "");
        fetchInitialMessages(token);

        const intervalId = setInterval(() => {
            pollNewMessages(token);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [router, username]);

    async function fetchInitialMessages(token: string) {
        setLoadingMessages(true);
        const response = await fetch(
            `https://chatapp.adnecto.in/api/dm/${username}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            const result = await response.json();
            setError(result.error?.message || "This conversation is unavailable.");
            setLoadingMessages(false);
            return;
        }

        const result = await response.json();
        setMessages(result.data);
        markIncomingMessagesSeen(result.data);

        if (result.data.length > 0) {
            lastTimestampRef.current = result.data[result.data.length - 1].created_at;
        }

        setLoadingMessages(false);
    }

    async function pollNewMessages(token: string) {
        if (!lastTimestampRef.current) return;

        const url = `https://chatapp.adnecto.in/api/dm/${username}?after=${encodeURIComponent(
            lastTimestampRef.current
        )}`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const result = await response.json();

        if (result.data.length > 0) {
            setMessages((prev) => [...prev, ...result.data]);
            markIncomingMessagesSeen(result.data);
            lastTimestampRef.current = result.data[result.data.length - 1].created_at;
        }
    }

    function markIncomingMessagesSeen(newMessages: Message[]) {
        const currentUsername = localStorage.getItem("username") || "";
        const latestIncoming = newMessages.reduce<Message | null>((latest, message) => {
            if (message.sender === currentUsername) return latest;
            if (!latest || Date.parse(message.created_at) > Date.parse(latest.created_at)) {
                return message;
            }
            return latest;
        }, null);

        if (!latestIncoming) return;

        const latestIncomingTime = Date.parse(latestIncoming.created_at);
        const lastSeenTime = Date.parse(localStorage.getItem("dmLastSeen") || "");
        if (!Number.isFinite(latestIncomingTime) || latestIncomingTime <= lastSeenTime) return;

        localStorage.setItem("dmLastSeen", latestIncoming.created_at);
        window.dispatchEvent(new Event("dm:read"));
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://chatapp.adnecto.in/api/dm/${username}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ body: newMessage }),
            }
        );

        const result = await response.json();

        if (!response.ok) {
            setError(result.error.message);
            setSending(false);
            return;
        }

        setMessages((prev) => [...prev, result.data]);
        lastTimestampRef.current = result.data.created_at;
        setNewMessage("");
        setSending(false);
    }

    if (checking) {
        return null;
    }


    async function handleBlock() {
        const confirmed = confirm(`Block ${username}? You won't see their messages anywhere.`);
        if (!confirmed) return;

        const token = localStorage.getItem("token");
        const response = await fetch(
            `https://chatapp.adnecto.in/api/blocks/${username}`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            const result = await response.json();
            alert(result.error.message);
            return;
        }

        router.push("/dm");
    }

    return (
        <div className="app-shell app-shell--thread">
            <Header />
            <main className="page-frame page-frame--thread">
                <button
                    onClick={() => router.push("/dm")}
                    className="back-link"
                >
                    ← Direct messages
                </button>

                <div className="thread-heading">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200/70">Conversation</p>
                        <h2 className="list-title text-lg">{username}</h2>
                    </div>
                    <button
                        onClick={handleBlock}
                        className="button button--danger"
                    >
                        <span aria-hidden="true">⊘</span> Block
                    </button>
                </div>
                {error && (
                    <p className="notice">
                        {error}
                    </p>
                )}

                <div className="message-panel mb-4">
                    {loadingMessages && <p className="empty-state">Loading messages...</p>}

                    {!loadingMessages && messages.length === 0 && !error && (
                        <p className="empty-state">No messages yet. Say hi.</p>
                    )}

                    {messages.map((msg) => {
                        const isOwn = msg.sender === currentUsername;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`message-bubble ${isOwn ? "message-bubble--own" : ""}`}
                                >
                                    <span>{msg.body}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form
                    onSubmit={handleSend}
                    className="composer"
                >
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="field"
                    />
                    <button
                        type="submit"
                        disabled={sending}
                        className="button button--primary"
                    >
                        Send
                    </button>
                </form>
            </main>
        </div>
    );
}