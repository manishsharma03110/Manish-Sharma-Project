# Stage 1: Build the application
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080
<<<<<<< HEAD
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
=======
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
>>>>>>> debe2fa3358e50ac16c8e6f2db3e8ff805b21914
