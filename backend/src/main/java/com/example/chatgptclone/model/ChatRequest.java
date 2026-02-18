package com.example.chatgptclone.model;

import java.util.List;

public class ChatRequest {
    private List<Message> messages;
    private String sessionId;

    public ChatRequest() {
    } // Jackson needs a no-arg constructor

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
