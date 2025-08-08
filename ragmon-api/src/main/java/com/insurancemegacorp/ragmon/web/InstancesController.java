package com.insurancemegacorp.ragmon.web;

import com.insurancemegacorp.ragmon.service.InstanceRegistry;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping(path = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
public class InstancesController {
    private final InstanceRegistry registry;
    private final Sinks.Many<Object> sink = Sinks.many().multicast().onBackpressureBuffer();

    public InstancesController(InstanceRegistry registry) {
        this.registry = registry;
    }

    @GetMapping("/instances")
    public List<InstanceRegistry.Instance> list() {
        return registry.list();
    }

    @GetMapping(path = "/instances/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Object> stream() {
        // simple ticker that emits the full list; can be optimized to diffs later
        return Flux.interval(Duration.ofSeconds(5)).map(t -> { registry.prune(); return registry.list(); });
    }
}


