"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

type Room = {
    id: number;
    name: string;
    created_by: string | null;
    created_at: string;
};

export default function RoomsPage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [newRoomName, setNewRoomName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [currentUsername, setCurrentUsername] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }
        setChecking(false);
        setCurrentUsername(localStorage.getItem("username") || "");
        fetchRooms(token);
    }, [router]);

    async function fetchRooms(token: string) {
        setLoadingRooms(true);
        const response = await fetch("https://chatapp.adnecto.in/api/rooms", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        setRooms(result.data);
        setLoadingRooms(false);
    }

    async function handleDeleteRoom(e: React.MouseEvent, roomId: number) {
        e.stopPropagation();

        const token = localStorage.getItem("token");
        const response = await fetch(
            `https://chatapp.adnecto.in/api/rooms/${roomId}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            const result = await response.json();
            alert(result.error.message);
            return;
        }

        setRooms((prev) => prev.filter((room) => room.id !== roomId));
    }

    async function handleCreateRoom(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        setCreateError("");

        const token = localStorage.getItem("token");
        const response = await fetch("https://chatapp.adnecto.in/api/rooms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: newRoomName }),
        });

        const result = await response.json();

        if (!response.ok) {
            setCreateError(result.error.message);
            setCreating(false);
            return;
        }

        setRooms((prev) => [...prev, result.data]);
        setNewRoomName("");
        setCreating(false);
    }

    if (checking) {
        return null;
    }

    return (
        <div className="app-shell">
            <Header />
            <main className="page-frame">
                <div className="page-heading rooms-heading">
                    <div>
                        <h1>Chat Rooms</h1>
                        <p>Rooms you can jump into</p>
                    </div>
                    <form onSubmit={handleCreateRoom} className="toolbar room-create-form">
                        <input
                            type="text"
                            placeholder="New room name"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="field"
                        />
                        <button
                            type="submit"
                            disabled={creating}
                            className="button button--primary"
                        >
                            {creating ? "..." : "Create"}
                        </button>
                    </form>
                </div>

                {createError && (
                    <p className="notice">
                        {createError}
                    </p>
                )}

                {loadingRooms && <p className="empty-state">Loading rooms...</p>}

                {!loadingRooms && rooms.length === 0 && (
                    <p className="empty-state">No rooms yet. Create the first one.</p>
                )}

                <ul className="list">
                    {rooms.map((room) => (
                        <li
                            key={room.id}
                            onClick={() => router.push(`/rooms/${room.id}`)}
                            className="list-item list-item--interactive"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="status-dot" />
                                <span className="list-title truncate">{room.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {room.created_by && (
                                    <span className="list-meta hidden sm:inline">by {room.created_by}</span>
                                )}
                                {room.created_by === currentUsername && (
                                    <button
                                        onClick={(e) => handleDeleteRoom(e, room.id)}
                                        className="button button--danger"
                                    >
                                        <span aria-hidden="true">×</span> Delete
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}