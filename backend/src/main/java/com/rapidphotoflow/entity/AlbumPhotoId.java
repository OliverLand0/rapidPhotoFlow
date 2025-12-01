package com.rapidphotoflow.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbumPhotoId implements Serializable {
    private UUID albumId;
    private UUID photoId;
}
