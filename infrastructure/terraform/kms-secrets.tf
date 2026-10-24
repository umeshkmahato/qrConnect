resource "aws_kms_key" "data" {
  description             = "${local.name} data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "data" {
  name          = "alias/${local.name}-data"
  target_key_id = aws_kms_key.data.key_id
}

# Application secrets — values are set out-of-band (never in tfvars/git).
resource "aws_secretsmanager_secret" "app" {
  for_each = toset([
    "jwt-access-secret",
    "jwt-refresh-secret",
    "otp-pepper",
    "database-url",
  ])
  name       = "${local.name}/${each.key}"
  kms_key_id = aws_kms_key.data.arn
}
