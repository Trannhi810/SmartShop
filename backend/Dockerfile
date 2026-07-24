# Stage 1: Build the application
FROM maven:3.9.5-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the application, skipping tests (tests will be run in CI)
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose port 8080 (Render default port for web services)
EXPOSE 8080
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
