from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # Using string IDs now

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            print(f"Client {client_id} disconnected")

    async def send_dm(self, message: str, sender_id: str, recipient_id: str):
        if recipient_id in self.active_connections:
            await self.active_connections[recipient_id].send_json({
                "sender_id": sender_id,
                "content": message,
                "timestamp": datetime.now().isoformat()
            })

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.send_dm(
                message["content"],
                client_id,
                message["recipient_id"]
            )
    except WebSocketDisconnect:
        manager.disconnect(client_id)