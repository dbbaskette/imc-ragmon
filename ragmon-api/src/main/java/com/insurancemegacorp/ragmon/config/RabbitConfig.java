package com.insurancemegacorp.ragmon.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;

@Configuration
@EnableRabbit
@EnableConfigurationProperties(RagmonProperties.class)
public class RabbitConfig {
}
