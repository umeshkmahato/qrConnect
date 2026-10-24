variable "region" {
  type    = string
  default = "ap-south-1" # Mumbai — India data residency
}

variable "environment" {
  type    = string
  default = "staging"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be dev, staging, or production"
  }
}

variable "domain_name" {
  description = "Public domain (e.g. api.nathconnect.in). Empty = ALB DNS only."
  type        = string
  default     = ""
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_multi_az" {
  type    = bool
  default = false # true in production
}

variable "api_image" {
  description = "ECR image URI for the API container"
  type        = string
  default     = ""
}

variable "api_desired_count" {
  type    = number
  default = 2
}

variable "documents_bucket_name" {
  description = "Globally-unique name for the private documents bucket"
  type        = string
}
