#!/bin/bash
# Initialize S3 bucket for local development

echo "Creating S3 bucket for RapidPhotoFlow..."
awslocal s3 mb s3://rpf-local-photos
echo "S3 bucket 'rpf-local-photos' created successfully"
