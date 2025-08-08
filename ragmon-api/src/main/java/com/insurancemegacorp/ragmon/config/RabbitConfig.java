package com.insurancemegacorp.ragmon.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;

@Configuration
@EnableRabbit
@EnableConfigurationProperties(RagmonProperties.class)
public class RabbitConfig {

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setPrefetchCount(50);
        factory.setConcurrentConsumers(1);
        factory.setMaxConcurrentConsumers(4);
        return factory;
    }

    @Bean
    public Queue monitorQueue(RagmonProperties props) {
        return new Queue(props.getRabbit().getMonitorQueue(), true);
    }
}
