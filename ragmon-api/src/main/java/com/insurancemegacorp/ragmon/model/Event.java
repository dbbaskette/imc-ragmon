package com.insurancemegacorp.ragmon.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Event {
    private String app;
    private String stage;
    private String docId;
    private long timestamp;
    private Long latencyMs;
    private String status;
    private String message;
    private String url; // optional URL to the app instance discovered from first message

    public Event() {}

    public Event(String app, String stage, String docId, long timestamp, Long latencyMs, String status, String message, String url) {
        this.app = app;
        this.stage = stage;
        this.docId = docId;
        this.timestamp = timestamp;
        this.latencyMs = latencyMs;
        this.status = status;
        this.message = message;
        this.url = url;
    }

    public String getApp() { return app; }
    public void setApp(String app) { this.app = app; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getDocId() { return docId; }
    public void setDocId(String docId) { this.docId = docId; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
