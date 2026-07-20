# syntax=docker/dockerfile:1
# Image Docker pour auth-service (build multi-stage : compilation puis image d exécution allégée)
# Utilise une image Maven officielle pour la compilation (fonctionne meme si
# le wrapper mvnw n est pas present dans ce service).

# --- Etape 1 : compilation ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# On copie dabord le pom.xml seul pour profiter du cache Docker sur les
# dependances (elles ne changent pas a chaque modification du code source)
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src src
RUN mvn package -DskipTests -B

# --- Etape 2 : image dexecution (JRE seul, sans outils de build) ---
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN addgroup --system agrycam && adduser --system --ingroup agrycam agrycam
COPY --from=build /app/target/*.jar app.jar
RUN chown agrycam:agrycam app.jar
USER agrycam

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
