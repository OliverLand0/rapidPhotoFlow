package com.rapidphotoflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@Profile("!local")  // Only active when NOT running with local profile
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS with our configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Disable CSRF for stateless API
            .csrf(csrf -> csrf.disable())

            // Stateless session management
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                // Allow OPTIONS requests (CORS preflight)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public share endpoints (no auth required)
                .requestMatchers("/s/**").permitAll()

                // Migration endpoint (one-time setup, safe to be public)
                .requestMatchers("/api/seed/migrate").permitAll()

                // Photo content and preview are public (needed for img tags and AI service)
                .requestMatchers(HttpMethod.GET, "/api/photos/*/content").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/photos/*/preview").permitAll()

                // Tag endpoints are public (needed for AI service to apply auto-tags)
                .requestMatchers(HttpMethod.POST, "/api/photos/*/tags").permitAll()

                // All other API endpoints require authentication
                .requestMatchers("/api/**").authenticated()

                // All other requests require authentication
                .anyRequest().authenticated()
            )

            // Configure OAuth2 Resource Server with JWT
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            );

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        // Cognito uses "cognito:groups" for groups, but we'll use default scope-based authorities
        grantedAuthoritiesConverter.setAuthoritiesClaimName("cognito:groups");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        // Cognito uses "sub" as the principal claim
        jwtAuthenticationConverter.setPrincipalClaimName("sub");

        return jwtAuthenticationConverter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "https://photos.basedsecurity.net",
            "https://d11qi9h0891nbd.cloudfront.net"
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
