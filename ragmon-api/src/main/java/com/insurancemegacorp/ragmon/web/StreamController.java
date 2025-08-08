package com.insurancemegacorp.ragmon.web;

import com.insurancemegacorp.ragmon.service.EventStore;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.Duration;

@RestController
public class StreamController {

    private final EventStore store;

    public StreamController(EventStore store) {
        this.store = store;
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<?>> stream() {
        Flux<ServerSentEvent<?>> events = store.stream()
                .map(e -> ServerSentEvent.builder(e).build());
        Flux<ServerSentEvent<?>> heartbeat = Flux.interval(Duration.ZERO, Duration.ofSeconds(5))
                .map(tick -> ServerSentEvent.builder("")
                        .event("heartbeat")
                        .build());
        return Flux.merge(heartbeat, events);
    }
}
