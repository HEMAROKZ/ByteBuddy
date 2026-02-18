package com.example.chatgptclone;

import com.example.chatgptclone.model.ChatRequest;
import com.example.chatgptclone.model.Conversation;
import com.example.chatgptclone.model.Message;
import com.example.chatgptclone.repository.ConversationRepository;
import com.example.chatgptclone.dto.MessageDTO;
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
    private final ConversationRepository conversationRepository;

    @Autowired
    public ChatController(ChatService chatService, ConversationRepository conversationRepository) {
        this.chatService = chatService;
        this.conversationRepository = conversationRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody ChatRequest request) {
        System.out.println("Received: " + request.getMessages());

        List<Message> messages = request.getMessages();
        String sessionId = request.getSessionId();
        String reply = chatService.getChatResponse(messages, sessionId);

        Map<String, Object> out = new HashMap<>();
        out.put("reply", reply);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/conversation/{sessionId}")
    public ResponseEntity<Map<String, Object>> getConversation(@PathVariable String sessionId) {
        Conversation conversation = conversationRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Convert ChatMessage to MessageDTO
        List<MessageDTO> messageDTOs = conversation.getMessages().stream()
                .map(cm -> new MessageDTO(cm.getId(), cm.getRole(), cm.getContent(), cm.getCreatedAt()))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("id", conversation.getId());
        result.put("sessionId", conversation.getSessionId());
        result.put("title", conversation.getTitle());
        result.put("messages", messageDTOs);
        result.put("createdAt", conversation.getCreatedAt());
        result.put("updatedAt", conversation.getUpdatedAt());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getAllConversations() {
        List<Conversation> conversations = conversationRepository.findAll();

        List<Map<String, Object>> result = conversations.stream()
                .map(conv -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", conv.getId());
                    map.put("sessionId", conv.getSessionId());
                    map.put("title", conv.getTitle());
                    map.put("createdAt", conv.getCreatedAt());
                    map.put("updatedAt", conv.getUpdatedAt());
                    map.put("messageCount", conv.getMessages().size());
                    return map;
                })
                .sorted((a, b) -> ((java.time.LocalDateTime) b.get("updatedAt"))
                        .compareTo((java.time.LocalDateTime) a.get("updatedAt")))
                .toList();

        return ResponseEntity.ok(result);
    }

    @PutMapping("/conversation/{sessionId}/rename")
    public ResponseEntity<Map<String, Object>> renameConversation(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> request) {
        Conversation conversation = conversationRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        String newTitle = request.get("title");
        conversation.setTitle(newTitle);
        conversationRepository.save(conversation);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", conversation.getSessionId());
        result.put("title", conversation.getTitle());

        return ResponseEntity.ok(result);
    }

}
