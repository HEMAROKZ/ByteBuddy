package com.example.chatgptclone;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String groqAiUrl;


    public String getChatResponse(List<Map<String, String>> messages) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(groqAiUrl);
            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("Authorization", "Bearer " + apiKey);

            // Convert messages into JSON
            ObjectMapper mapper = new ObjectMapper();
            String messagesJson = mapper.writeValueAsString(messages);

            String body = """
        {
          "model": "llama3-8b-8192",
          "messages": %s
        }
        """.formatted(messagesJson);

            httpPost.setEntity(new StringEntity(body, StandardCharsets.UTF_8));

            String raw = client.execute(httpPost,
                    resp -> new String(resp.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));

            JsonNode root = new ObjectMapper().readTree(raw);
            JsonNode choices = root.path("choices");

            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText();
            } else {
                return "⚠ No reply from Groq.";
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "⚠ Error calling Groq: " + e.getMessage();
        }
    }

}
