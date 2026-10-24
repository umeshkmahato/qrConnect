# ACM certificate + optional Route53 record.

resource "aws_acm_certificate" "main" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}

# If the domain's zone is in Route53, create the record automatically.
# Otherwise output validation CNAMEs for manual DNS setup.
output "acm_validation_records" {
  value = var.domain_name != "" ? aws_acm_certificate.main[0].domain_validation_options : []
}
