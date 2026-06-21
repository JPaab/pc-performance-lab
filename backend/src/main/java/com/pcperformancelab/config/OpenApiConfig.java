package com.pcperformancelab.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI pcPerformanceLabOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PC Performance Lab API")
                        .version("v1")
                        .description("API for tracking PC hardware snapshots, tuning profiles and gaming performance sessions."));
    }
}