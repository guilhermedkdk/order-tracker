# API image, used by the root docker-compose.yml and by the Render deploy.

FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace
# Dependencies first, so editing the code reuses this layer.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -ntp dependency:go-offline
COPY src src
# Tests and formatting run in CI; the image only packages.
RUN ./mvnw -B -ntp -DskipTests -Dspotless.check.skip=true package \
    && cp target/order-tracker-*.jar app.jar

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --uid 1001 app
COPY --from=build /workspace/app.jar app.jar
USER app
# Inside a container the API must listen on every interface (docs/DECISIONS.md).
ENV SERVER_ADDRESS=0.0.0.0 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
