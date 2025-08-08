package com.insurancemegacorp.ragmon.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurancemegacorp.ragmon.config.RagmonProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping(path = "/api/test", produces = MediaType.APPLICATION_JSON_VALUE)
@Profile("dev")
public class TestPublishController {

    private final RabbitTemplate rabbitTemplate;
    private final RagmonProperties props;
    private final ObjectMapper objectMapper;

    public TestPublishController(RabbitTemplate rabbitTemplate, RagmonProperties props, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/publish")
    public Map<String, Object> publish() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("status", "PROCESSING");
        payload.put("timestamp", Instant.now().toString());
        Map<String, Object> meta = new HashMap<>();
        meta.put("service", "testPublisher");
        meta.put("processingState", "STARTED");
        meta.put("inputMode", "scdf");
        payload.put("meta", meta);

        String json = objectMapper.writeValueAsString(payload);
        // default exchange with routing key == queue name
        rabbitTemplate.convertAndSend("", props.getRabbit().getMonitorQueue(), json);
        return Map.of("sentTo", props.getRabbit().getMonitorQueue(), "payload", payload);
    }
}
