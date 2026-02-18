# ByteBuddy - AI Chat Application

A full-featured chat application with **persistent conversation history** that uses **Groq's LLaMA AI** for responses. Built with **Spring Boot** backend and **React** frontend, with **MySQL** database for message persistence.

## Features

✨ **Core Features**

- Real-time AI chat with Groq API (LLaMA 3.1 8B Instant model)
- Persistent conversation storage in MySQL
- Full conversation history with context awareness
- Sidebar with conversation management
- Rename conversations
- Start new conversations
- Auto-generates conversation titles from first message
- Session-based conversation tracking

## Tech Stack

**Backend:**

- Java 17+
- Spring Boot 3.2.4
- Spring Data JPA
- MySQL 8+
- Apache HttpClient 5
- Groq API

**Frontend:**

- React 18
- Axios for API calls
- CSS for styling
- LocalStorage for session management

**DevOps:**

- Docker & Docker Compose
- Kong API Gateway (optional)

## Prerequisites

### Required

- **Java 17+** - [Download](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- **Maven** or **Gradle** - Backend build tool
- **Node.js 18+** and **npm** - [Download](https://nodejs.org/)
- **MySQL 8+** - [Download](https://dev.mysql.com/downloads/mysql/) or use Docker

### Optional

- **Docker & Docker Compose** - For containerized deployment
- **Groq API Key** - [Get free key](https://console.groq.com/keys)

## Quick Start (Local Development)

### 1️⃣ Set Up MySQL Database

**Option A: Using Docker**

```bash
docker run -d \
  --name mysql-chatbot \
  -e MYSQL_ROOT_PASSWORD=Raghukanch007@ \
  -e MYSQL_DATABASE=chatbot_db \
  -p 3306:3306 \
  mysql:8.0
```

**Option B: Using existing MySQL installation**

```sql
CREATE DATABASE chatbot_db;
```

### 2️⃣ Configure Groq API Key

Edit `backend/src/main/resources/application.properties`:

```properties
server.port=8081
groq.api.key=your_groq_api_key_here
groq.api.url=https://api.groq.com/openai/v1/chat/completions

spring.datasource.url=jdbc:mysql://localhost:3306/chatbot_db
spring.datasource.username=root
spring.datasource.password=Raghukanch007@
spring.jpa.hibernate.ddl-auto=update
```

Get your free Groq API key from [console.groq.com](https://console.groq.com/keys)

### 3️⃣ Run Backend

```bash
cd backend
gradle bootRun
```

Backend will start on **http://localhost:8081**

### 4️⃣ Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend will start on **http://localhost:3000**

## API Endpoints

### Chat Endpoint

```
POST /api/chat
Content-Type: application/json

Request:
{
  "messages": [
    {
      "role": "user",
      "content": "What is AI?"
    }
  ],
  "sessionId": "session-xyz-123"
}

Response:
{
  "reply": "AI stands for Artificial Intelligence..."
}
```

### Get Conversation History

```
GET /api/conversation/{sessionId}

Response:
{
  "id": 1,
  "sessionId": "session-xyz-123",
  "title": "What is AI?",
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "What is AI?",
      "createdAt": "2024-02-18T10:30:00"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "AI stands for...",
      "createdAt": "2024-02-18T10:30:05"
    }
  ],
  "createdAt": "2024-02-18T10:30:00",
  "updatedAt": "2024-02-18T10:35:00"
}
```

### List All Conversations

```
GET /api/conversations

Response:
[
  {
    "id": 1,
    "sessionId": "session-xyz-123",
    "title": "What is AI?",
    "messageCount": 5,
    "createdAt": "2024-02-18T10:30:00",
    "updatedAt": "2024-02-18T10:35:00"
  }
]
```

### Rename Conversation

```
PUT /api/conversation/{sessionId}/rename
Content-Type: application/json

Request:
{
  "title": "New Conversation Title"
}

Response:
{
  "sessionId": "session-xyz-123",
  "title": "New Conversation Title"
}
```

## Docker Deployment

The `docker-compose.yml` file automates the entire setup:

```bash
# Start all services (MySQL, Backend, Frontend, Kong)
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Remove volumes (cleanup data)
docker-compose down -v
```

**What gets deployed:**

- **MySQL 8.0** on port 3306 (database)
- **Backend (Spring Boot)** on port 8081 (API server)
- **Frontend (React)** on port 3000 (web UI)
- **Kong API Gateway** on port 8000 (API routing, optional)

## Project Structure

```
ByteBuddy/
├── backend/                           # Spring Boot Backend
│   ├── src/main/java/.../
│   │   ├── ChatController.java        # REST API endpoints
│   │   ├── ChatService.java           # Business logic & Groq integration
│   │   ├── model/
│   │   │   ├── Conversation.java      # Conversation entity (DB table)
│   │   │   ├── ChatMessage.java       # Message entity (DB table)
│   │   │   └── Message.java           # API request/response model
│   │   ├── repository/
│   │   │   ├── ConversationRepository.java    # Database access
│   │   │   └── ChatMessageRepository.java     # Database access
│   │   ├── dto/
│   │   │   └── MessageDTO.java        # Data transfer object
│   │   └── WebConfig.java             # CORS configuration
│   ├── build.gradle                   # Dependencies
│   └── src/main/resources/
│       └── application.properties      # Configuration
│
├── frontend/                          # React Frontend
│   ├── src/
│   │   ├── App.js                     # Main chat component
│   │   ├── chat-bot.css               # Styling
│   │   └── index.js                   # Entry point
│   ├── public/
│   │   ├── index.html
│   │   └── bytebuddy-logo.png
│   └── package.json                   # Dependencies
│
├── docker-compose.yml                 # Docker orchestration
├── kong.yml                           # API Gateway config (optional)
├── Dockerfile                         # Container images
└── README.md                          # This file
```

## How It Works

### Conversation Flow

```
1. User Types Message
         ↓
2. Frontend sends to Backend POST /api/chat
         ↓
3. Backend loads full conversation history from MySQL
         ↓
4. Backend sends to Groq API:
   - Complete conversation history
   - New user message
   - Selected model (llama-3.1-8b-instant)
         ↓
5. Groq API generates AI response
         ↓
6. Backend saves in MySQL:
   - User message to chat_messages table
   - AI response to chat_messages table
         ↓
7. Backend returns reply to Frontend
         ↓
8. Frontend updates UI and reloads conversation list
```

### Data Model

**conversations table:**

```
id (PK)
session_id (UNIQUE)
title (VARCHAR)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**chat_messages table:**

```
id (PK)
conversation_id (FK)
role (user/assistant)
content (LONGTEXT)
created_at (TIMESTAMP)
```

### Why Persistence Matters

- **Full Context**: AI always knows the complete conversation history
- **No Token Loss**: Information persists across browser refreshes
- **Management**: Users can switch between conversations
- **Analytics**: Track conversation patterns
- **Scalability**: Multiple concurrent sessions

## Configuration

### Environment Variables

Override settings without code changes:

```bash
# Backend
export GROQ_API_KEY="your-api-key"
export DB_URL="jdbc:mysql://localhost:3306/chatbot_db"
export DB_USER="root"
export DB_PASSWORD="password"
export SERVER_PORT="8081"

# Frontend
export REACT_APP_API_URL="http://localhost:8081"
```

### Supported AI Models

Edit [ChatService.java](backend/src/main/java/com/example/chatgptclone/ChatService.java) line ~40 to change:

**Available Free Models (Groq):**

- `llama-3.1-8b-instant` ⭐ (default - fastest)
- `llama-3.1-70b-versatile` (more powerful)
- `mixtral-8x7b-32768` (balanced)

Check [Groq Models](https://console.groq.com/docs/models) for latest options.

## Troubleshooting

### Issue: Frontend can't connect to Backend

**Solution:**

- Verify backend running: `http://localhost:8081/api/conversations`
- Check CORS in `WebConfig.java` allows `localhost:3000`
- Clear browser cache: Ctrl+Shift+Delete
- Check browser console for errors: F12

### Issue: Database connection failed

**Solution:**

```bash
# Verify MySQL is running
mysql -u root -p

# Check tables exist
USE chatbot_db;
SHOW TABLES;

# Recreate database if needed
DROP DATABASE chatbot_db;
CREATE DATABASE chatbot_db;
```

### Issue: Groq API returns 401 error

**Solution:**

- Visit [console.groq.com](https://console.groq.com/keys)
- Generate new API key
- Update `application.properties`
- Restart backend

### Issue: Messages not saving to database

**Solution:**

- Check Spring Boot logs for SQL errors
- Verify database user has CREATE/INSERT privileges
- Ensure `spring.jpa.hibernate.ddl-auto=update`
- Check if tables were created: `SHOW TABLES IN chatbot_db;`

## Performance Optimization

For production deployments:

1. **Database Indexing**

   ```sql
   CREATE INDEX idx_session_id ON conversations(session_id);
   CREATE INDEX idx_conversation_id ON chat_messages(conversation_id);
   ```

2. **Connection Pooling** (HikariCP in Spring Boot)

   ```properties
   spring.datasource.hikari.maximum-pool-size=10
   ```

3. **Pagination** (for large conversation lists)

   ```java
   Page<Conversation> findAll(Pageable pageable);
   ```

4. **Caching** (Redis)
   ```java
   @Cacheable("conversations")
   public List<Conversation> getAllConversations() { }
   ```

## Security Best Practices

⚠️ **Critical:**

- ❌ Never commit API keys to git
- ✅ Use environment variables
- ✅ Use `.gitignore` for `application.properties`
- ✅ HTTPS in production
- ✅ Input validation on all endpoints

**Additional:**

- Implement user authentication (Spring Security)
- Add rate limiting (API protection)
- Use CORS whitelist (not wildcard)
- SQL injection prevention (use JPA)
- XSS protection (React escapes by default)

## Future Enhancements

- [ ] User authentication & authorization
- [ ] Multi-user conversations
- [ ] Message search & filters
- [ ] Conversation export (PDF/JSON)
- [ ] Real-time WebSocket chat
- [ ] Message reactions & pinning
- [ ] Custom system prompts
- [ ] Image upload support
- [ ] Conversation branching/forking
- [ ] Analytics & usage stats

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - Use freely for personal and commercial projects.

## Support & Community

- **Issues**: Report bugs on GitHub
- **Discussions**: Share ideas and questions
- **Docs**: Check wiki for advanced topics
- **Contact**: Raise an issue or discussion

---

**Built with ❤️ using Spring Boot, React, MySQL, and Groq AI**

_Last Updated: February 18, 2026_
