package com.insurancemegacorp.ragmon.web;

import com.insurancemegacorp.ragmon.model.Event;
import com.insurancemegacorp.ragmon.service.EventStore;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(path = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
public class ApiController {

    private final EventStore store;

    public ApiController(EventStore store) {
        this.store = store;
    }

    @GetMapping("/events/recent")
    public List<Object> recent() {
        return store.recentEvents();
    }

    @GetMapping("/metrics")
    public Map<String, Long> metrics() {
        return store.metricsCountsByStatus();
    }

    @GetMapping("/apps")
    public Map<String, String> apps() {
        return store.apps();
    }

    @GetMapping("/queues")
    public Map<String, Object> queues() {
        // Placeholder until Rabbit management API is integrated
        return Map.of(
                "observedApps", store.countsByApp(),
                "note", "Queue metrics integration pending"
        );
    }
}
