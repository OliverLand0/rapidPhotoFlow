package com.rapidphotoflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security configuration for local development.
 * Enables JWT authentication with Cognito but with relaxed CORS.
 * Only active when SPRING_PROFILES_ACTIVE=local
 */
@Configuration
@Profile("local")
@EnableWebSecurity
public class LocalSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain localSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS
            .cors(cors -> cors.configurationSource(localCorsConfigurationSource()))

            // Disable CSRF for API
            .csrf(csrf -> csrf.disable())

            // Configure JWT authentication
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))

            // Permit health checks and public endpoints, require auth for others
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/s/**").permitAll()  // Public share endpoints
                .requestMatchers("/api/photos/*/content").permitAll()
                .requestMatchers("/api/photos/*/preview").permitAll()
                .requestMatchers("/api/photos/*/thumbnail").permitAll()
                .requestMatchers("/api/internal/**").permitAll()  // Internal service-to-service APIs
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource localCorsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
