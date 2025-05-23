**Digital Family Vault**

## Project Description
....

## Technologies Used
- Frontend:
  - HTML5
  - JavaScript
  - TailwindCSS
  - Font Awesome Icons
  - WebSocket (Chat)
  - Geolocation API
  - File Upload API

- Backend:
  - Python 3.11.12
  - FastAPI
  - SQLAlchemy
  - SQLite
  - JWT 
  - OAuth2 
  - Cloudinary
  - OpenAI/DeepSeek
  - WebSocket
  - SMTP
  - Uvicorn

## API & Libraries:
- FastAPI
- SQLAlchemy
- Pydantic
- Passlib
- PyJWT
- Authlib
- Cloudinary
- OpenAI (Deepseek API)
- Python-socketio
- Python-multipart
- Requests
- Bcrypt

## Tools
- Visual Studio Code 
- Git + GitHub 
- Trello 
- ESLint

## Deploy
- Render (Backend)
- Netlify (Frontend)

## Installation & Setup

### 1. Prerequisites
Make sure you have the following installed:
- Python 3.7+

### 2. Setup Instructions

1. Create and activate a virtual environment
2. Install requirements.txt
3. Update backend/config.py to reflect dev and frontend server addresses (eg: setting backend_url to http://localhost:8000)
4. Update backend/config.py to reflect dev and frontend server addresses (eg: setting BASE_URL to http://localhost:3000)

#### Run the backend server:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
#### Run the frontend server (in a separate terminal):
``` bash
python -m http.server 3000
```
3. Access the Application

Backend API will be available at: http://localhost:8000
Frontend will be available at: http://localhost:3000/login.html

## File Structure
```shell
├── backend
│   ├── auth.py
│   ├── chat_api.py
│   ├── chat_server.py
│   ├── comments.py
│   ├── config.py
│   ├── database.py
│   ├── email_service.py
│   ├── family_management.py
│   ├── main.py
│   ├── memory.py
│   ├── profile.py
│   └── translate.py
├── components
│   ├── family_icon.html
│   ├── nav_bottom.html
│   ├── nav_top_auth.html
│   └── nav_top_guest.html
├── scripts
│   ├── add_nav.js
│   ├── announcement.js
│   ├── config.js
│   ├── create_family.js
│   ├── dark_mode.js
│   ├── family_details.js
│   ├── family_photo_upload.js
│   ├── family-groups.js
│   ├── family-members.js
│   ├── geolocation.js
│   ├── groupChatPage.js
│   ├── groupChats.js
│   ├── inbox-chat-page.js
│   ├── invite.js
│   ├── join_family.js
│   ├── join_link.js
│   ├── load_family_icon.js
│   ├── manage-mambers.js
│   ├── member-cathegories.js
│   ├── nav.js
│   ├── photo_page_upload.js
│   ├── recipe_page_upload.js
│   ├── stories_page_upload.js
│   ├── video_page_upload.js
├── 404.html
├── about.html
├── create-family.html
├── delete-account.html
├── family-groups.html
├── family-members.html
├── forgot-password.html
├── group-chats.html
├── GroupChatPage.html
├── inbox_chats.html
├── inbox_page.html
├── index.html
├── invite.html
├── join-family.html
├── login.html
├── manage-members.html
├── member-cathegories.html
├── photos.html
├── pivacy.html
├── profile.html
├── recipes.html
├── register.html
├── reset-password.html
├── settings.html
├── stories.html
├── template.html
├── unsubscribe.html
├── verify-email.html
└── videos.html
```


## Contributing
1. Fork this repo
2. Create a new branch
3. Make changes
4. Commit and push
5.Create a pull request


## About Us
Team Name: DTC-12
Team Members: 
- Derek Cao (Set 1E) 
- Hank Zhao (Set 1F)
- Courtney Lum (Set 1E)
- Kiana Karimi (Set 2F)
- Ramandeep Kaur (Set 2F)

