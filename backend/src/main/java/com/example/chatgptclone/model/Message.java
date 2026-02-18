package com.example.chatgptclone.model;

public class Messages {
    private String Role;
    private String Contant;

    public Messages() {
    }
    public Messages(String role, String contant) {
        Role = role;
        Contant = contant;
    }

    public String getRole() {
        return Role;
    }

    public void setRole(String role) {
        Role = role;
    }

    public String getContant() {
        return Contant;
    }

    public void setContant(String contant) {
        Contant = contant;
    }
}
