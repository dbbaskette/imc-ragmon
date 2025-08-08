package com.insurancemegacorp.ragmon.amqp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurancemegacorp.ragmon.config.RagmonProperties;
import com.insurancemegacorp.ragmon.model.Event;
import com.insurancemegacorp.ragmon.service.EventStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "ragmon.rabbit", name = "enabled", havingValue = "true", matchIfMissing = true)
public class MonitoringListener {
    private static final Logger log = LoggerFactory.getLogger(MonitoringListener.class);

    private final ObjectMapper objectMapper;
    private final EventStore eventStore;
    private final RagmonProperties properties;

    public MonitoringListener(ObjectMapper objectMapper, EventStore eventStore, RagmonProperties properties) {
        this.objectMapper = objectMapper;
        this.eventStore = eventStore;
        this.properties = properties;
    }

    @RabbitListener(queues = "monitorQueue")
    public void handle(byte[] body) {
        try {
            JsonNode node = objectMapper.readTree(body);
            Event event = new Event();

            // Support two shapes:
            // 1) Direct fields: app, stage, docId, timestamp, latencyMs, status, message, url
            // 2) textProc metrics: status + meta.service, meta.processingState, meta.inputMode, lastError, timestamp
            if (node.has("meta") && node.get("meta").has("service")) {
                JsonNode meta = node.get("meta");
                event.setApp(text(meta, "service"));
                // Prefer processingState then inputMode as stage surrogate
                event.setStage(text(meta, "processingState") != null ? text(meta, "processingState") : text(meta, "inputMode"));
                event.setStatus(text(node, "status"));
                event.setMessage(text(node, "lastError"));
                long ts = node.has("timestamp") ? parseTimestamp(node.get("timestamp")) : System.currentTimeMillis();
                event.setTimestamp(ts);
            } else {
                event.setApp(text(node, "app"));
                event.setStage(text(node, "stage"));
                event.setDocId(text(node, "docId"));
                long ts = node.has("timestamp") ? node.get("timestamp").asLong() : System.currentTimeMillis();
                event.setTimestamp(ts);
                if (node.has("latencyMs")) event.setLatencyMs(node.get("latencyMs").asLong());
                event.setStatus(text(node, "status"));
                event.setMessage(text(node, "message"));
                if (node.has("url")) event.setUrl(node.get("url").asText());
            }

            eventStore.add(event);
        } catch (Exception e) {
            log.warn("Failed to parse monitoring message", e);
        }
    }

    private static long parseTimestamp(JsonNode node) {
        if (node.isNumber()) return node.asLong();
        // Accept ISO-8601 strings, fallback to now
        try {
            return java.time.Instant.parse(node.asText()).toEpochMilli();
        } catch (Exception e) {
            return System.currentTimeMillis();
        }
    }

    @SuppressWarnings("unused")
    public RagmonProperties getRagmonProperties() {
        return properties;
    }

    private static String text(JsonNode n, String field) {
        return n != null && n.has(field) ? n.get(field).asText() : null;
    }
}
