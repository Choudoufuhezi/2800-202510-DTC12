from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from config import settings

app = FastAPI()

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    session_cookie="session_cookie"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from auth import router as auth_router
from family_management import router as family_router
from profile import router as profile_router
from memory import router as memory_router
from comments import router as comments_router
app.include_router(auth_router)
app.include_router(family_router)
app.include_router(memory_router)
app.include_router(comments_router)
app.include_router(profile_router) 

from chat_server import router as chat_router
app.include_router(chat_router)

@app.get("/")
def read_root():
    return {"status": "ok"}