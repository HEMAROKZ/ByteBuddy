package com.example.chatgptclone;

import com.example.chatgptclone.model.ChatMessage;
import com.example.chatgptclone.model.Conversation;
import com.example.chatgptclone.model.Message;
import com.example.chatgptclone.repository.ConversationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ChatService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String groqAiUrl;

    @Autowired
    private ConversationRepository conversationRepository;

    public String getChatResponse(List<Message> messages, String sessionId) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            // Get or create conversation
            Conversation conversation = conversationRepository.findBySessionId(sessionId)
                    .orElseGet(() -> {
                        Conversation newConv = new Conversation(sessionId);
                        return conversationRepository.save(newConv);
                    });

            // Save ONLY the new user message to database
            String userContent = messages.get(messages.size() - 1).getContent();
            ChatMessage userMsg = new ChatMessage("user", userContent);
            conversation.addMessage(userMsg);

            // Auto-generate title from first message if it's still "New Chat"
            if ("New Chat".equals(conversation.getTitle()) && conversation.getMessages().size() <= 2) {
                String title = userContent.length() > 50
                        ? userContent.substring(0, 50) + "..."
                        : userContent;
                conversation.setTitle(title);
            }

            // Build complete message history from database
            List<Message> fullMessageHistory = conversation.getMessages().stream()
                    .map(cm -> {
                        Message msg = new Message();
                        msg.setRole(cm.getRole());
                        msg.setContent(cm.getContent());
                        return msg;
                    })
                    .toList();

            HttpPost httpPost = new HttpPost(groqAiUrl);
            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("Authorization", "Bearer " + apiKey);

            // Convert FULL message history to JSON for Groq API
            ObjectMapper mapper = new ObjectMapper();
            String messagesJson = mapper.writeValueAsString(fullMessageHistory);

            String body = """
                    {
                      "model": "llama-3.1-8b-instant",
                      "messages": %s
                    }
                    """.formatted(messagesJson);

            httpPost.setEntity(new StringEntity(body, StandardCharsets.UTF_8));

            String raw = client.execute(httpPost,
                    resp -> new String(resp.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));

            JsonNode root = new ObjectMapper().readTree(raw);
            JsonNode choices = root.path("choices");

            if (choices.isArray() && choices.size() > 0) {
                String reply = choices.get(0).path("message").path("content").asText();

                // Save AI response to database
                ChatMessage aiMsg = new ChatMessage("assistant", reply);
                conversation.addMessage(aiMsg);
                conversationRepository.save(conversation);

                return reply;
            } else {
                return "⚠ No reply from Groq.";
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "⚠ Error calling Groq: " + e.getMessage();
        }
    }

}
