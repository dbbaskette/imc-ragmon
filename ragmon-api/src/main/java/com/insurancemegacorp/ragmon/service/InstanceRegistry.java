package com.insurancemegacorp.ragmon.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class InstanceRegistry {
    public static class Instance {
        public String service;
        public String instanceId;
        public String url;
        public String status;
        public long lastHeartbeatAt;
        public long lastActivityAt;
        public Long bootEpoch;
        public String version;
        public Map<String,Object> meta;
    }

    private final Map<String, Instance> byKey = new ConcurrentHashMap<>();
    // Liveness windows (ms)
    private static final long ACTIVITY_WINDOW_MS = 30_000;  // Alive if activity within 30s
    private static final long OFFLINE_WINDOW_MS  = 120_000; // Remove if no activity > 120s

    public void updateFromMessage(String service, String instanceId, String url, String status, boolean isHeartbeat, Long bootEpoch, String version, Map<String,Object> meta) {
        if (service == null || instanceId == null) return;
        String key = service + "::" + instanceId;
        Instance inst = byKey.computeIfAbsent(key, k -> new Instance());
        inst.service = service;
        inst.instanceId = instanceId;
        if (url != null && !url.isBlank()) inst.url = url;
        if (status != null) inst.status = status;
        inst.lastActivityAt = Instant.now().toEpochMilli();
        if (isHeartbeat) inst.lastHeartbeatAt = inst.lastActivityAt;
        if (bootEpoch != null) inst.bootEpoch = bootEpoch;
        if (version != null) inst.version = version;
        inst.meta = meta;
    }

    public List<Instance> list() {
        long now = Instant.now().toEpochMilli();
        List<Instance> instances = new ArrayList<>();
        
        for (Instance inst : byKey.values()) {
            // Create a copy to avoid modifying the stored instance
            Instance copy = new Instance();
            copy.service = inst.service;
            copy.instanceId = inst.instanceId;
            copy.url = inst.url;
            copy.lastHeartbeatAt = inst.lastHeartbeatAt;
            copy.lastActivityAt = inst.lastActivityAt;
            copy.bootEpoch = inst.bootEpoch;
            copy.version = inst.version;
            copy.meta = inst.meta;
            
            // Determine dynamic status based on activity
            long lastActivity = Math.max(inst.lastActivityAt, inst.lastHeartbeatAt);
            if (lastActivity > 0 && (now - lastActivity) <= ACTIVITY_WINDOW_MS) {
                // Instance is active - use original status or default to RUNNING
                copy.status = (inst.status != null && !inst.status.isBlank()) ? inst.status : "RUNNING";
            } else {
                // Instance is inactive
                copy.status = "OFFLINE";
            }
            
            instances.add(copy);
        }
        
        return instances;
    }

    public void prune() {
        long now = Instant.now().toEpochMilli();
        byKey.entrySet().removeIf(e -> {
            Instance i = e.getValue();
            long last = i.lastActivityAt > 0 ? i.lastActivityAt : i.lastHeartbeatAt;
            return last > 0 && (now - last) > OFFLINE_WINDOW_MS;
        });
    }
}


