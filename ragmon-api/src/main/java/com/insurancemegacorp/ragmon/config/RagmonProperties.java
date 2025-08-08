package com.insurancemegacorp.ragmon.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ragmon")
public class RagmonProperties {
    private final Rabbit rabbit = new Rabbit();
    private final Security security = new Security();
    private final Stream stream = new Stream();

    public Rabbit getRabbit() { return rabbit; }
    public Security getSecurity() { return security; }
    public Stream getStream() { return stream; }

    public static class Rabbit {
        private String host;
        private int port;
        private String vhost;
        private String username;
        private String password;
        private String monitorQueue = "ragmon.monitor";

        public String getHost() { return host; }
        public void setHost(String host) { this.host = host; }
        public int getPort() { return port; }
        public void setPort(int port) { this.port = port; }
        public String getVhost() { return vhost; }
        public void setVhost(String vhost) { this.vhost = vhost; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getMonitorQueue() { return monitorQueue; }
        public void setMonitorQueue(String monitorQueue) { this.monitorQueue = monitorQueue; }
    }

    public static class Security {
        private final Basic basic = new Basic();
        public Basic getBasic() { return basic; }
        public static class Basic {
            private String username;
            private String password;
            public String getUsername() { return username; }
            public void setUsername(String username) { this.username = username; }
            public String getPassword() { return password; }
            public void setPassword(String password) { this.password = password; }
        }
    }

    public static class Stream {
        private String transport = "sse";
        private int retentionWindowSeconds = 600;
        public String getTransport() { return transport; }
        public void setTransport(String transport) { this.transport = transport; }
        public int getRetentionWindowSeconds() { return retentionWindowSeconds; }
        public void setRetentionWindowSeconds(int retentionWindowSeconds) { this.retentionWindowSeconds = retentionWindowSeconds; }
    }
}
