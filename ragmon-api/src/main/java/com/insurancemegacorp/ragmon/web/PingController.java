package com.insurancemegacorp.ragmon.web;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(path = "/api", produces = MediaType.TEXT_PLAIN_VALUE)
public class PingController {

    @GetMapping("/ping")
    public Mono<String> ping() {
        return Mono.just("pong");
    }
}
