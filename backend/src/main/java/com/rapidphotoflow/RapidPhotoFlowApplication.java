package com.rapidphotoflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RapidPhotoFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(RapidPhotoFlowApplication.class, args);
    }
}
