# PostgreSQL (RDS) — private subnets only, encrypted, automated backups.

resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier             = local.name
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.data.arn
  multi_az               = var.db_multi_az
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  db_name                = "nathconnect"
  username               = "nathconnect"
  password               = random_password.db.result

  backup_retention_period   = var.environment == "production" ? 30 : 7
  backup_window             = "02:00-03:00"
  maintenance_window        = "sun:04:00-sun:05:00"
  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${local.name}-final" : null
  apply_immediately         = var.environment != "production"
  publicly_accessible       = false

  performance_insights_enabled = true
}

resource "random_password" "db" {
  length  = 32
  special = false
}
