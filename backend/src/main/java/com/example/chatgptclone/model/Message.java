package com.example.chatgptclone.model;
// Message.java
public class Message {
    private String role;
    private String content;

    public Message() {} // Jackson needs a no-arg constructor


    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @Override
    public String toString() {
        return "Message{role='" + role + "', content='" + content + "'}";
    }
}
