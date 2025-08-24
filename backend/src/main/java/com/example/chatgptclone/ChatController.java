package com.example.chatgptclone;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;

    @Autowired
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

//
@PostMapping("/chat")
public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, Object> payload) {
    // Extract messages from request
    List<Map<String, String>> messages = (List<Map<String, String>>) payload.get("messages");

    String reply = chatService.getChatResponse(messages);

    Map<String, Object> out = new HashMap<>();
    out.put("reply", reply);
    return ResponseEntity.ok(out);
}

}
