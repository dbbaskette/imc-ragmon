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
    private final Deque<Object> events = new ArrayDeque<>();
    private final Map<String, String> appToUrl = new ConcurrentHashMap<>();
    private final Sinks.Many<Object> sink = Sinks.many().multicast().onBackpressureBuffer();
    private final Duration retention;

    public EventStore(RagmonProperties props) {
        this.retention = Duration.ofSeconds(props.getStream().getRetentionWindowSeconds());
    }

    public void add(Object event) {
        synchronized (events) {
            events.addLast(event);
            if (event instanceof Event e && e.getApp() != null && e.getUrl() != null) {
                appToUrl.put(e.getApp(), e.getUrl());
            }
            evictOld();
        }
        sink.tryEmitNext(event);
    }

    private void evictOld() {
        long cutoff = Instant.now().minus(retention).toEpochMilli();
        while (!events.isEmpty()) {
            Object o = events.peekFirst();
            long ts;
            if (o instanceof Event e) ts = e.getTimestamp(); else ts = System.currentTimeMillis();
            if (ts < cutoff) events.removeFirst(); else break;
        }
    }

    public List<Object> recentEvents() {
        synchronized (events) {
            evictOld();
            return new ArrayList<>(events);
        }
    }

    public Flux<Object> stream() {
        return sink.asFlux();
    }

    public Map<String, Long> metricsCountsByStatus() {
        synchronized (events) {
            return events.stream()
                    .filter(o -> o instanceof Event)
                    .map(o -> (Event) o)
                    .collect(Collectors.groupingBy(Event::getStatus, Collectors.counting()));
        }
    }

    public Map<String, Long> countsByApp() {
        synchronized (events) {
            return events.stream()
                    .filter(o -> o instanceof Event)
                    .map(o -> (Event) o)
                    .collect(Collectors.groupingBy(Event::getApp, Collectors.counting()));
        }
    }

    public Map<String, String> apps() {
        return appToUrl;
    }
}
