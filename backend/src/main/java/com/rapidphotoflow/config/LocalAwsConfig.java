package com.rapidphotoflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

/**
 * AWS configuration for local development using LocalStack.
 * Only active when SPRING_PROFILES_ACTIVE=local
 */
@Configuration
@Profile("local")
public class LocalAwsConfig {

    @Value("${aws.s3.endpoint:http://localhost:4566}")
    private String s3Endpoint;

    @Bean
    @Primary
    public S3Client localS3Client() {
        return S3Client.builder()
                .endpointOverride(URI.create(s3Endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test", "test")))
                .forcePathStyle(true) // Required for LocalStack
                .build();
    }
}
