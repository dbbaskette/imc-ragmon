package com.insurancemegacorp.ragmon.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.net.URI;

@RestController
public class RootController {

    @GetMapping("/")
    public Mono<ResponseEntity<Void>> root() {
        return Mono.just(ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create("/index.html"))
                .build());
    }
}
