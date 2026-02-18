# Build stage
FROM gradle:8.5-jdk17 AS builder

WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle ./

# Copy source code
COPY src src/

# Build the application
RUN gradle clean build -x test

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy jar from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Set environment variables
ENV GROQ_API_KEY=""
ENV SPRING_DATASOURCE_URL="jdbc:mysql://mysql:3306/chatbot_db"
ENV SPRING_DATASOURCE_USERNAME="root"
ENV SPRING_DATASOURCE_PASSWORD="password"

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
