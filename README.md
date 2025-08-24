# BYTEBUDDY (Spring Boot + React)

A simple web app chat bot NAME BYTEBUDDY  that mimics ChatGPT using groq Chat Completions API. Backend is Java Spring Boot; frontend is React.

## Prereqs
- Java 17+
- Gradle installed (or use your local Gradle to run `bootRun`)
- Node.js 18+ / npm

## 1) Configure API Key
Edit `backend/src/main/resources/application.properties` and set:
```
groq.api.key=YOUR_OPENAI_API_KEY
```
Or export an environment variable before running backend:
```
export GROQ_API_KEY=sk-...   # macOS/Linux
setx GROQ_API_KEY "sk-..."   # Windows (new shell after)
```

## 2) Run Backend
```
cd backend
gradle bootRun
```
Backend runs on http://localhost:8080

## 3) Run Frontend
```
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000

## What’s inside
- `backend/ChatController.java`: `/api/chat` endpoint that calls OpenAI `v1/chat/completions` with model `gpt-4o-mini` and returns `{ "reply": "..." }`.
- `backend/WebConfig.java`: CORS for localhost:3000.
- `frontend/src/App.js`: Minimal chat UI that posts to backend and renders the reply.

## Notes
- Do **not** put your groq API key in the frontend.
- You can swap the model in `ChatController.java` if desired.
- For token streaming, replace the request with SSE/WebFlux and enable streaming in the API request.

Enjoy!
