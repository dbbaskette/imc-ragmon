package com.insurancemegacorp.ragmon.web;

import com.insurancemegacorp.ragmon.model.Event;
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
    public Flux<ServerSentEvent<Event>> stream() {
        Flux<ServerSentEvent<Event>> events = store.stream()
                .map(e -> ServerSentEvent.<Event>builder(e).event("event").build());
        Flux<ServerSentEvent<Event>> heartbeat = Flux.interval(Duration.ofSeconds(10))
                .map(tick -> ServerSentEvent.<Event>builder().event("heartbeat").data((Event) null).build());
        return Flux.merge(heartbeat, events);
    }
}
