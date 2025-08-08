package com.insurancemegacorp.ragmon.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Event {
    private String app;
    private String stage;
    private String event; // INIT, HEARTBEAT, FILE_PROCESSED
    private String instanceId;
    private String docId;
    private long timestamp;
    private Long latencyMs;
    private String status;
    private String message;
    private String url; // optional URL to the app instance discovered from first message
    private String uptime;
    private String hostname;
    private String publicHostname;
    private String currentFile;
    private Long filesProcessed;
    private Long filesTotal;
    private Long totalChunks;
    private Long processedChunks;
    private Double processingRate;
    private Long errorCount;
    private Double memoryUsedMB;
    private Long pendingMessages;
    private String filename;

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
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }
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
    public String getUptime() { return uptime; }
    public void setUptime(String uptime) { this.uptime = uptime; }
    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }
    public String getPublicHostname() { return publicHostname; }
    public void setPublicHostname(String publicHostname) { this.publicHostname = publicHostname; }
    public String getCurrentFile() { return currentFile; }
    public void setCurrentFile(String currentFile) { this.currentFile = currentFile; }
    public Long getFilesProcessed() { return filesProcessed; }
    public void setFilesProcessed(Long filesProcessed) { this.filesProcessed = filesProcessed; }
    public Long getFilesTotal() { return filesTotal; }
    public void setFilesTotal(Long filesTotal) { this.filesTotal = filesTotal; }
    public Long getTotalChunks() { return totalChunks; }
    public void setTotalChunks(Long totalChunks) { this.totalChunks = totalChunks; }
    public Long getProcessedChunks() { return processedChunks; }
    public void setProcessedChunks(Long processedChunks) { this.processedChunks = processedChunks; }
    public Double getProcessingRate() { return processingRate; }
    public void setProcessingRate(Double processingRate) { this.processingRate = processingRate; }
    public Long getErrorCount() { return errorCount; }
    public void setErrorCount(Long errorCount) { this.errorCount = errorCount; }
    public Double getMemoryUsedMB() { return memoryUsedMB; }
    public void setMemoryUsedMB(Double memoryUsedMB) { this.memoryUsedMB = memoryUsedMB; }
    public Long getPendingMessages() { return pendingMessages; }
    public void setPendingMessages(Long pendingMessages) { this.pendingMessages = pendingMessages; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
}
