package com.insurancemegacorp.ragmon.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.userdetails.MapReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public MapReactiveUserDetailsService userDetailsService(
            @Value("${ragmon.security.basic.username}") String username,
            @Value("${ragmon.security.basic.password}") String password
    ) {
        PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        UserDetails user = User.withUsername(username)
                .password(encoder.encode(password))
                .roles("USER")
                .build();
        return new MapReactiveUserDetailsService(user);
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(
            ServerHttpSecurity http,
            @Value("${ragmon.security.allowAnonymousRead:false}") boolean allowAnonymousRead
    ) {
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeExchange(exchanges -> {
                    exchanges
                            .pathMatchers("/", "/actuator/health", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll();
                    if (allowAnonymousRead) {
                        exchanges.pathMatchers("/stream", "/api/events/**", "/api/metrics", "/api/apps", "/api/queues").permitAll();
                    }
                    exchanges.anyExchange().authenticated();
                })
                .httpBasic(Customizer.withDefaults())
                .build();
    }
}
