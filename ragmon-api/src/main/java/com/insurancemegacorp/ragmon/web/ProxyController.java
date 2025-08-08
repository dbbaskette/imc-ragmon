package com.insurancemegacorp.ragmon.web;

import com.insurancemegacorp.ragmon.service.EventStore;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping(path = "/api/proxy")
public class ProxyController {

    private final EventStore store;
    private final WebClient webClient;

    public ProxyController(EventStore store, WebClient.Builder webClientBuilder) {
        this.store = store;
        this.webClient = webClientBuilder.build();
    }

    @RequestMapping(path = "/{app}/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE}, consumes = MediaType.ALL_VALUE, produces = MediaType.ALL_VALUE)
    public Mono<ResponseEntity<byte[]>> proxy(@PathVariable("app") String app,
                                              @RequestHeader HttpHeaders headers,
                                              @RequestParam MultiValueMap<String, String> query,
                                              @RequestBody(required = false) Mono<byte[]> body,
                                              ServerHttpRequest request,
                                              ServerWebExchange exchange) {
        return forward(app, suffixFrom(request, app), headers, query, body, request.getMethod());
    }

    private String suffixFrom(ServerHttpRequest request, String app) {
        String raw = request.getPath().pathWithinApplication().value();
        String base = "/api/proxy/" + app;
        if (raw.startsWith(base)) {
            return raw.substring(base.length());
        }
        return "";
    }

    private Mono<ResponseEntity<byte[]>> forward(String app,
                                                 String path,
                                                 HttpHeaders headers,
                                                 MultiValueMap<String, String> query,
                                                 Mono<byte[]> body,
                                                 HttpMethod method) {
        String baseUrl = store.apps().get(app);
        if (baseUrl == null || baseUrl.isBlank()) {
            return Mono.just(ResponseEntity.status(404).body((byte[]) null));
        }
        StringBuilder target = new StringBuilder();
        target.append(baseUrl);
        if (path != null && !path.isBlank()) {
            if (!path.startsWith("/")) target.append('/');
            target.append(path);
        }
        if (query != null && !query.isEmpty()) {
            target.append('?');
            target.append(query.entrySet().stream()
                    .flatMap(e -> e.getValue().stream().map(v ->
                            URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" + URLEncoder.encode(v, StandardCharsets.UTF_8)))
                    .reduce((a, b) -> a + "&" + b).orElse(""));
        }

        WebClient.RequestBodySpec spec = webClient.method(method == null ? HttpMethod.GET : method)
                .uri(URI.create(target.toString()))
                .headers(h -> copyHeaders(headers, h));

        Mono<ClientResponse> exchangeMono = (method == HttpMethod.GET || method == HttpMethod.DELETE)
                ? spec.exchangeToMono(Mono::just)
                : spec.body(BodyInserters.fromPublisher(body == null ? Mono.empty() : body, byte[].class))
                    .exchangeToMono(Mono::just);

        return exchangeMono.flatMap(resp -> resp.bodyToMono(byte[].class)
                .defaultIfEmpty(new byte[0])
                .map(bytes -> ResponseEntity.status(resp.statusCode())
                        .headers(copyBackHeaders(resp.headers().asHttpHeaders()))
                        .body(bytes)));
    }

    private void copyHeaders(HttpHeaders src, HttpHeaders dst) {
        if (src == null) return;
        for (Map.Entry<String, java.util.List<String>> e : src.entrySet()) {
            String name = e.getKey();
            if (HttpHeaders.HOST.equalsIgnoreCase(name) || HttpHeaders.CONTENT_LENGTH.equalsIgnoreCase(name)) {
                continue;
            }
            dst.put(name, e.getValue());
        }
    }

    private HttpHeaders copyBackHeaders(HttpHeaders src) {
        HttpHeaders out = new HttpHeaders();
        for (Map.Entry<String, java.util.List<String>> e : src.entrySet()) {
            String name = e.getKey();
            if (HttpHeaders.TRANSFER_ENCODING.equalsIgnoreCase(name)) continue;
            out.put(name, e.getValue());
        }
        return out;
    }
}


