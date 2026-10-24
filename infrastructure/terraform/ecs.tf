# ECS Fargate + ALB. Chosen over EC2 for lower operational burden;
# see docs/architecture/adr-001-hosting.md for the trade-off analysis.

resource "aws_ecs_cluster" "main" {
  name = local.name
}

resource "aws_lb" "main" {
  name               = local.name
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "api" {
  name        = "${local.name}-api"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path                = "/api/v1/health/live"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

# HTTPS listener (requires ACM certificate; HTTP->HTTPS redirect rule when cert absent)
resource "aws_lb_listener" "https" {
  count             = var.domain_name != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate.main[0].arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = var.domain_name != "" ? "redirect" : "forward"
    dynamic "redirect" {
      for_each = var.domain_name != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    target_group_arn = var.domain_name == "" ? aws_lb_target_group.api.arn : null
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name  = "api"
    image = var.api_image != "" ? var.api_image : "public.ecr.aws/docker/library/node:20-alpine"
    portMappings = [{ containerPort = 3000 }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "API_PORT", value = "3000" },
      { name = "REDIS_URL", value = "rediss://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379" },
      { name = "S3_BUCKET", value = aws_s3_bucket.documents.bucket },
      { name = "S3_REGION", value = var.region },
      { name = "OTP_DEV_ECHO", value = "false" },
    ]
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.app["database-url"].arn },
      { name = "JWT_ACCESS_SECRET", valueFrom = aws_secretsmanager_secret.app["jwt-access-secret"].arn },
      { name = "JWT_REFRESH_SECRET", valueFrom = aws_secretsmanager_secret.app["jwt-refresh-secret"].arn },
      { name = "OTP_PEPPER", valueFrom = aws_secretsmanager_secret.app["otp-pepper"].arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "api"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:3000/api/v1/health/live || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "${local.name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_desired_count
  launch_type     = "FARGATE"
  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.api.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
  depends_on = [aws_lb_listener.http]
}
