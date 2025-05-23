# Digital Family Vault 

## Project Description

Due to families losing memories, traditions, and struggling to stay connected, we are creating a 'digital heirloom' vault, that is a secure, organized platform to preserve memories in one central place, tightening the bond between generations.

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

## APIs Used:
- Cloudinary
- OpenAI (Deepseek API)
- Google Cloud Services

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
1. Create a file called .env in root and add the contents from passwords.txt.
2. Make sure you have the following installed:
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


## Features
- **Family Management**
  - Create and join families through button in family-groups.html
  - Invite family members via unique invite codes after a family has been created

- **Memory Preservation**
  - Upload and organize family memories by clicking on a family member, selecting the type of memory, and uploading it through a form
  - Location tags are automatically applied to memories
  - Add descriptions and tags to memories by clicking on a memory, the blue edit button, and editing the description text
  - Leave a comment on a memory by navigating to it, typing a comment in the comment box, and sending it
  - Delete a memory by navigating to it as a family admin or memory uploader and clicking on the red trash symbol in the top left corner

- **Real Time Chat**
  - Family group chat functionality
     - Create a new groupchat by creating a new family and clicking the "Create family groupchat" option
     - Groupchat can be accessed through the family details page or the groupchats page which lists all existing groupchats
  - Unread markers on the groupchat list page
  - Multi-language support with AI translation

- **User Features**
  - Google OAuth integration
  - Customizable user profiles
  - Profile picture and background customization
  - Email verification system
  - Password reset functionality

## File Structure
```shell
├── .gitignore
├── README.md
├── .vscode/
│   └── settings.json
├── backend/
│   ├── .env
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
│   ├── readme.md
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── translate.py
│   ├── data/
│   │   └── users.db
│   ├── models/
│   │   ├── auth_models.py
│   │   ├── comment_models.py
│   │   ├── family_models.py
│   │   ├── memory_models.py
│   │   ├── profile_models.py
│   │   └── __pycache__/
│   ├── utils/
│   │   ├── auth_utils.py
│   │   ├── user_utils.py
│   │   └── __pycache__/
│   └── __pycache__/
├── frontend/
│   ├── 404.html
│   ├── about.html
│   ├── create-family.html
│   ├── delete-account.html
│   ├── eslint.config.js
│   ├── family-groups.html
│   ├── family-members.html
│   ├── forgot-password.html
│   ├── group-chats.html
│   ├── group_chat_page.html
│   ├── inbox_chats.html
│   ├── inbox_page.html
│   ├── index.html
│   ├── inject_family_icon.py
│   ├── invite.html
│   ├── join-family.html
│   ├── login.html
│   ├── manage-members.html
│   ├── member-categories.html
│   ├── photos.html
│   ├── privacy.html
│   ├── profile.html
│   ├── recipes.html
│   ├── register.html
│   ├── reset-password.html
│   ├── settings.html
│   ├── stories.html
│   ├── template.html
│   ├── terms.html
│   ├── unsubscribe.html
│   ├── verify-email.html
│   ├── videos.html
│   ├── _redirects
│   ├── components/
│   │   ├── family_icon.html
│   │   ├── nav_bottom.html
│   │   ├── nav_top_auth.html
│   │   └── nav_top_guest.html
│   ├── images/
│   │   ├── default-icon.png
│   │   ├── family.webp
│   │   ├── family2.webp
│   │   ├── family3.jpg
│   │   ├── family4.jpg
│   │   ├── family_digital_vault.png
│   │   ├── images.jfif
│   │   ├── Instagram-Pink-Background-edit-online-1.jpg
│   │   ├── sample_video.png
│   │   └── user_image.png
│   └── scripts/
│       ├── add_nav.js
│       ├── announcement.js
│       ├── config.js
│       ├── create-family.js
│       ├── dark_mode.js
│       ├── family-groups.js
│       ├── family-members.js
│       ├── family_details.js
│       ├── family_photo_upload.js
│       ├── geolocation.js
│       ├── group_chats.js
│       ├── group_chat_page.js
│       ├── inbox-chat-page.js
│       ├── invite.js
│       ├── join-link.js
│       ├── join_family.js
│       ├── loading.js
│       ├── load_family_icon.js
│       ├── manage-members.js
│       ├── member-categories.js
│       ├── photo_page_upload.js
│       ├── recipe_page_upload.js
│       ├── tailwind.config.js
│       ├── verify_JWT.js
│       └── video_page_upload.js
```

## About Us
Team Name: DTC-12
Team Members: 
- Derek Cao (Set 1E) - dcao12@my.bcit.ca
- Hank Zhao (Set 1F) -  hzhao74@my.bcit.ca
- Courtney Lum (Set 1E) - clum27@my.bcit.ca
- Kiana Karimi (Set 2F) - kkarimi7@my.bcit.ca
- Ramandeep Kaur (Set 2F) - rramandeepkaur11@my.bcit.ca

## Credits

This project has used AI language models such as ChatGPT (https://openai.com/) and Deepseek (https://www.deepseek.com/) for ideas and to generate content for our terms of service and privacy policy as well as assorted animations and SVG graphics.

The idea to use Cloudinary was inspired by a video created by Patrick Guichon in the Tech Gems folder.

File upload functionality was implemented with guidance from MDN Web Docs (https://developer.mozilla.org/), using their examples and documentation.

This project makes use of the following open-source libraries and APIs. We gratefully acknowledge their authors and maintainers:

### Libraries & Frameworks
- <a href="https://tailwindcss.com/">TailwindCSS</a> (MIT License)
- <a href="https://fastapi.tiangolo.com/">FastAPI</a> (MIT License)
- <a href="https://www.sqlalchemy.org/">SQLAlchemy</a> (MIT License)
- <a href="https://www.uvicorn.org/">Uvicorn</a> (BSD License)
- <a href="https://sqlite.org/">SQLite </a> (Public Domain)
- <a href="https://eslint.org/">ESLint</a> (MIT License) 
- <a href="https://fontawesome.com/">Font Awesome</a> (MIT License)

### APIs & Cloud Services
- <a href="https://cloudinary.com/">Cloudinary</a>
- <a href="https://deepseeksai.com/api/">Deepseek API</a>
- <a href="https://cloud.google.com/apis">Google Cloud Services</a>

### Hosting
- <a href="https://www.netlify.com/">Netlify</a>
- <a href="https://render.com/">Render</a>

All services are used in compliance with their terms of services.