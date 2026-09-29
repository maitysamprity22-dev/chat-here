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

export default function RoomThreadPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id;

    const [checking, setChecking] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [blockingUsername, setBlockingUsername] = useState("");
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
    }, [router, roomId]);

    async function fetchInitialMessages(token: string) {
        setLoadingMessages(true);
        const response = await fetch(
            `https://chatapp.adnecto.in/api/rooms/${roomId}/messages`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            setError("This room no longer exists.");
            setLoadingMessages(false);
            return;
        }

        const result = await response.json();
        setMessages(result.data);

        if (result.data.length > 0) {
            lastTimestampRef.current = result.data[result.data.length - 1].created_at;
        }

        setLoadingMessages(false);
    }

    async function pollNewMessages(token: string) {
        if (!lastTimestampRef.current) return;

        const url = `https://chatapp.adnecto.in/api/rooms/${roomId}/messages?after=${encodeURIComponent(
            lastTimestampRef.current
        )}`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const result = await response.json();

        if (result.data.length > 0) {
            setMessages((prev) => [...prev, ...result.data]);
            lastTimestampRef.current = result.data[result.data.length - 1].created_at;
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://chatapp.adnecto.in/api/rooms/${roomId}/messages`,
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

    async function handleBlock(username: string) {
        const confirmed = confirm(`Block ${username}? You won't see their messages anywhere.`);
        if (!confirmed) return;

        setBlockingUsername(username);
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
            setError(result.error?.message || "Could not block this user.");
            setBlockingUsername("");
            return;
        }

        setMessages((prev) => prev.filter((message) => message.sender !== username));
        setBlockingUsername("");
    }

    if (checking) {
        return null;
    }

    return (
        <div className="app-shell app-shell--thread">
            <Header />
            <main className="page-frame page-frame--thread">
                <button
                    onClick={() => router.push("/rooms")}
                    className="back-link"
                >
                    ← Chat rooms
                </button>

                {error && (
                    <p className="notice">
                        {error}
                    </p>
                )}

                <div className="message-panel mb-4">
                    {loadingMessages && <p className="empty-state">Loading messages...</p>}

                    {!loadingMessages && messages.length === 0 && (
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
                                    {!isOwn && (
                                        <div className="message-actions">
                                            <button
                                                onClick={() => router.push(`/dm/${msg.sender}`)}
                                                className="message-author hover:underline"
                                            >
                                                {msg.sender}
                                            </button>
                                            <button
                                                onClick={() => router.push(`/dm/${msg.sender}`)}
                                                className="message-action"
                                            >
                                                DM
                                            </button>
                                            <button
                                                onClick={() => handleBlock(msg.sender)}
                                                disabled={blockingUsername === msg.sender}
                                                className="message-action text-black"
                                            >
                                                {blockingUsername === msg.sender ? "..." : "Block"}
                                            </button>
                                        </div>
                                    )}
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