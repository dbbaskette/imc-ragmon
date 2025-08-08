package com.insurancemegacorp.ragmon.amqp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurancemegacorp.ragmon.config.RagmonProperties;
import com.insurancemegacorp.ragmon.model.Event;
import com.insurancemegacorp.ragmon.service.EventStore;
import com.insurancemegacorp.ragmon.service.InstanceRegistry;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
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
    private final InstanceRegistry registry;

    public MonitoringListener(ObjectMapper objectMapper, EventStore eventStore, RagmonProperties properties, InstanceRegistry registry) {
        this.objectMapper = objectMapper;
        this.eventStore = eventStore;
        this.properties = properties;
        this.registry = registry;
    }

    @RabbitListener(queues = "#{monitorQueue.name}")
    public void handle(Message message) {
        try {
            byte[] body = message.getBody();
            JsonNode node = objectMapper.readTree(body);
            
            // Debug logging to see what messages we're receiving
            String messageText = new String(body);
            log.info("📨 RECEIVED AMQP MESSAGE: {}", messageText);
            Event event = new Event();

            if (node.has("meta") && node.get("meta").has("service")) {
                JsonNode meta = node.get("meta");
                event.setApp(text(meta, "service"));
                event.setStage(text(meta, "processingStage") != null ? text(meta, "processingStage") : 
                              text(meta, "processingState") != null ? text(meta, "processingState") : text(meta, "inputMode"));
                if (node.has("event")) {
                    event.setEvent(text(node, "event"));
                }
                event.setInstanceId(text(node, "instanceId"));
                event.setStatus(text(node, "status"));
                event.setMessage(text(node, "lastError"));
                long ts = node.has("timestamp") ? parseTimestamp(node.get("timestamp")) : System.currentTimeMillis();
                event.setTimestamp(ts);
                event.setUptime(text(node, "uptime"));
                event.setHostname(text(node, "hostname"));
                event.setPublicHostname(text(node, "publicHostname"));
                event.setCurrentFile(text(node, "currentFile"));
                if (node.has("filesProcessed")) event.setFilesProcessed(node.get("filesProcessed").asLong());
                if (node.has("filesTotal")) event.setFilesTotal(node.get("filesTotal").asLong());
                if (node.has("totalChunks")) event.setTotalChunks(node.get("totalChunks").asLong());
                if (node.has("processedChunks")) event.setProcessedChunks(node.get("processedChunks").asLong());
                if (node.has("processingRate")) event.setProcessingRate(node.get("processingRate").asDouble());
                if (node.has("errorCount")) event.setErrorCount(node.get("errorCount").asLong());
                if (node.has("memoryUsedMB")) event.setMemoryUsedMB(node.get("memoryUsedMB").asDouble());
                if (node.has("pendingMessages") && !node.get("pendingMessages").isNull()) event.setPendingMessages(node.get("pendingMessages").asLong());
                if (node.has("filename") && !node.get("filename").isNull()) event.setFilename(node.get("filename").asText());

                // Check if URL is already provided in the message
                String providedUrl = text(node, "url");
                if (providedUrl == null) providedUrl = text(node, "publicUrl");
                if (providedUrl == null) providedUrl = text(node, "internalUrl");
                
                if (providedUrl != null && !providedUrl.isBlank()) {
                    log.info("✅ USING PROVIDED URL: '{}'", providedUrl);
                    event.setUrl(providedUrl);
                } else if (event.getUrl() == null) {
                    log.info("🔨 CONSTRUCTING URL FROM HOSTNAME...");
                    String host = event.getPublicHostname() != null ? event.getPublicHostname() : event.getHostname();
                    log.info("🏠 HOST INFO - publicHostname: '{}', hostname: '{}', selected: '{}'", 
                        event.getPublicHostname(), event.getHostname(), host);
                    
                    if (host != null && !host.isBlank()) {
                        String val = host;
                        if (!val.startsWith("http://") && !val.startsWith("https://")) {
                            val = "http://" + val;
                        }
                        // If no explicit port present, append default from config
                        String withoutScheme = val.replaceFirst("^[a-zA-Z]+://", "");
                        log.info("🔍 URL CONSTRUCTION - original host: '{}', withoutScheme: '{}', hasPort: {}", 
                            host, withoutScheme, withoutScheme.contains(":"));
                        
                        if (!withoutScheme.contains(":")) {
                            int port = properties.getApps().getDefaultPort();
                            log.info("⚙️  ADDING DEFAULT PORT: {} (from config)", port);
                            if (!val.endsWith("/")) {
                                val = val + ":" + port;
                            } else {
                                val = val.substring(0, val.length()-1) + ":" + port;
                            }
                        }
                        log.info("🔗 FINAL URL: '{}'", val);
                        event.setUrl(val);
                    }
                }

                // Update instance registry
                String instanceId = text(node, "instanceId");
                boolean isHeartbeat = "INIT".equalsIgnoreCase(event.getEvent()) || "HEARTBEAT".equalsIgnoreCase(event.getEvent());
                Long bootEpoch = node.has("bootEpoch") && node.get("bootEpoch").isNumber() ? node.get("bootEpoch").asLong() : null;
                String version = text(node, "version");
                registry.updateFromMessage(event.getApp(), instanceId, event.getUrl(), event.getStatus(), isHeartbeat, bootEpoch, version, objectMapper.convertValue(meta, Map.class));
            } else {
                event.setApp(text(node, "app"));
                event.setStage(text(node, "stage"));
                if (node.has("event")) {
                    event.setEvent(text(node, "event"));
                }
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
        try {
            return java.time.Instant.parse(node.asText()).toEpochMilli();
        } catch (Exception e) {
            return System.currentTimeMillis();
        }
    }

    private static String text(JsonNode n, String field) {
        return n != null && n.has(field) ? n.get(field).asText() : null;
    }
}
