package com.rapidphotoflow.domain;

public enum EventType {
    PHOTO_CREATED,
    PROCESSING_STARTED,
    PROCESSING_COMPLETED,
    PROCESSING_FAILED,
    APPROVED,
    REJECTED,
    DELETED,
    RETRY_REQUESTED,
    TAG_ADDED,
    TAG_REMOVED,
    AUTO_TAGGED
}
