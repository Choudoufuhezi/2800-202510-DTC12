from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set
import json
from datetime import datetime
from sqlalchemy.orm import Session
from database import ChatRoom, UserChatRoom, create_chatroom, create_userchatroom, create_message, get_db

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # client_id: WebSocket
        self.chatroom_members: Dict[int, Set[str]] = {}  # chatroom_id: set of client_ids

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            print(f"Client {client_id} disconnected")

    async def join_chatroom(self, user_id: str, chatroom_id: int, db: Session):
        # check if chatroom exists, create if not
        if chatroom_id not in self.chatroom_members:
            chatroom = db.query(ChatRoom).filter(ChatRoom.id == chatroom_id).first()
            if not chatroom:
                chatroom = create_chatroom(db, f"Chatroom {chatroom_id}", datetime.now())
                chatroom_id = chatroom.id 
            
            self.chatroom_members[chatroom_id] = set()

        # Add user to in-memory tracking TODO: move to database in the future
        self.chatroom_members[chatroom_id].add(user_id)
        
        # Add user to chatroom in database (many-to-many relationship)
        user_chatroom = db.query(UserChatRoom).filter(
            UserChatRoom.user_id == int(user_id),
            UserChatRoom.chatroom_id == chatroom_id
        ).first()
        
        if not user_chatroom:
            create_userchatroom(db, int(user_id), chatroom_id)

    async def leave_chatroom(self, user_id: str, chatroom_id: int):
        if chatroom_id in self.chatroom_members and user_id in self.chatroom_members[chatroom_id]:
            self.chatroom_members[chatroom_id].remove(user_id)

    async def broadcast_to_chatroom(self, db: Session, message: str, sender_id: str, chatroom_id: int):
        # First save the message to database
        db_message = create_message(
            db,
            user_id=int(sender_id),
            chatroom_id=chatroom_id,
            message_text=message,
            time_stamp=datetime.now()
        )
        
        # Then broadcast to all members in the chatroom (except sender)
        if chatroom_id in self.chatroom_members:
            for member_id in self.chatroom_members[chatroom_id]:
                if member_id in self.active_connections and member_id != sender_id:
                    await self.active_connections[member_id].send_json({
                        "sender_id": sender_id,
                        "content": message,
                        "chatroom_id": chatroom_id,
                        "timestamp": db_message.time_stamp.isoformat(),
                        "message_id": db_message.id
                    })

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    client_id: str,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "join_chatroom":
                await manager.join_chatroom(
                    user_id=client_id,
                    chatroom_id=message["chatroom_id"],
                    db=db
                )
                await websocket.send_json({
                    "status": "success",
                    "message": f"Joined chatroom {message['chatroom_id']}"
                })
                
            elif message["type"] == "leave_chatroom":
                await manager.leave_chatroom(
                    user_id=client_id,
                    chatroom_id=message["chatroom_id"]
                )
                await websocket.send_json({
                    "status": "success",
                    "message": f"Left chatroom {message['chatroom_id']}"
                })
                
            elif message["type"] == "chat_message":
                await manager.broadcast_to_chatroom(
                    db=db,
                    message=message["content"],
                    sender_id=client_id,
                    chatroom_id=message["chatroom_id"]
                )
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        # Clean up user from all chatrooms
        for chatroom_id in list(manager.chatroom_members.keys()):
            if client_id in manager.chatroom_members[chatroom_id]:
                manager.chatroom_members[chatroom_id].remove(client_id)