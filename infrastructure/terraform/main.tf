terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.70" }
  }
  # Remote state: configure an S3 backend + DynamoDB lock before production use.
  # backend "s3" {
  #   bucket         = "nathconnect-tfstate"
  #   key            = "env/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "nathconnect-tf-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "nathconnect"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name = "nathconnect-${var.environment}"
}
