package com.insurancemegacorp.ragmon.web;

import com.insurancemegacorp.ragmon.model.Event;
import com.insurancemegacorp.ragmon.service.EventStore;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
public class StreamController {

    private final EventStore store;

    public StreamController(EventStore store) {
        this.store = store;
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Event> stream() {
        return store.stream();
    }
}
