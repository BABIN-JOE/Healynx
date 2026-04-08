# app/core/events.py

from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        living_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
                living_connections.append(connection)
            except:
                pass  # dead socket
        self.active_connections = living_connections


# global singleton for admin realtime events
admin_realtime_manager = ConnectionManager()
