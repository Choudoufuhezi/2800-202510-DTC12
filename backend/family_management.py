import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import os
from sqlalchemy.orm import Session
from database import get_db, get_user, create_user
from database import User as DBUser
from config import settings


router = APIRouter(prefix="/family")