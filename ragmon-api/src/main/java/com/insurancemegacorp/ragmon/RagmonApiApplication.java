package com.insurancemegacorp.ragmon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import com.insurancemegacorp.ragmon.service.InstanceRegistry;

@SpringBootApplication
public class RagmonApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(RagmonApiApplication.class, args);
    }

    @Bean
    public InstanceRegistry instanceRegistry() {
        return new InstanceRegistry();
    }
}
