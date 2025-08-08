package com.insurancemegacorp.ragmon.service;

import com.insurancemegacorp.ragmon.config.RagmonProperties;
import com.insurancemegacorp.ragmon.model.Event;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class EventStore {
    private final Deque<Event> events = new ArrayDeque<>();
    private final Map<String, String> appToUrl = new ConcurrentHashMap<>();
    private final Sinks.Many<Event> sink = Sinks.many().multicast().onBackpressureBuffer();
    private final Duration retention;

    public EventStore(RagmonProperties props) {
        this.retention = Duration.ofSeconds(props.getStream().getRetentionWindowSeconds());
    }

    public void add(Event event) {
        synchronized (events) {
            events.addLast(event);
            if (event.getApp() != null && event.getUrl() != null) {
                appToUrl.putIfAbsent(event.getApp(), event.getUrl());
            }
            evictOld();
        }
        sink.tryEmitNext(event);
    }

    private void evictOld() {
        long cutoff = Instant.now().minus(retention).toEpochMilli();
        while (!events.isEmpty() && events.peekFirst().getTimestamp() < cutoff) {
            events.removeFirst();
        }
    }

    public List<Event> recentEvents() {
        synchronized (events) {
            evictOld();
            return new ArrayList<>(events);
        }
    }

    public Flux<Event> stream() {
        return sink.asFlux();
    }

    public Map<String, Long> metricsCountsByStatus() {
        synchronized (events) {
            return events.stream().collect(Collectors.groupingBy(Event::getStatus, Collectors.counting()));
        }
    }

    public Map<String, Long> countsByApp() {
        synchronized (events) {
            return events.stream().collect(Collectors.groupingBy(Event::getApp, Collectors.counting()));
        }
    }

    public Map<String, String> apps() {
        return appToUrl;
    }
}
