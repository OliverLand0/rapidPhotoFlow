package com.rapidphotoflow.dto;

import com.rapidphotoflow.domain.PhotoStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StatusCountDTO {
    private PhotoStatus status;
    private long count;
}
