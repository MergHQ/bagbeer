provider "aws" {
  region = "eu-central-1"
}

data "aws_ssm_parameter" "api_token" {
  name = "bagbeer-api-token"
}

data "aws_ssm_parameter" "poly_id" {
  name = "bagbeer-poly-id"
}

data "aws_ecr_repository" "repository" {
  name = "bagbeer"
}

data "aws_ecs_cluster" "cluster" {
  cluster_name = "christina-regina"
}

data "aws_iam_role" "bagbeer_service_iam_role" {
  name = "ecsTaskExecutionRole"
}

data "aws_security_group" "bagbeer_lb_sg" {
  name = "bagbeer-sg"
}

data "aws_subnet" "subnet" {
  id = "subnet-12bb6368"
}

data "aws_vpc" "vpc" {
  id = "vpc-073bec6f"
}

data "aws_alb" "merg_lb" {
  name = "merg-lb"
}

data "aws_alb_listener" "merg_listener" {
  load_balancer_arn = "${data.aws_alb.merg_lb.arn}"
  port = 443
}

resource "aws_alb_target_group" "bagbeer_lb_target_group" {
  name        = "bagbeer-target-group"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = "${data.aws_vpc.vpc.id}"
  target_type = "ip"

  health_check {
    path = "/health"
    matcher = 200
  }
}

resource "aws_alb_listener_rule" "tko_aly_fi_listener_rule" {
  listener_arn = "${data.aws_alb_listener.merg_listener.arn}"

  action {
    type             = "forward"
    target_group_arn = "${aws_alb_target_group.bagbeer_lb_target_group.arn}"
  }

  condition {
    host_header {
      values = ["pk-api.lab.juiciness.io"]
    }
  }
}

resource "aws_cloudwatch_log_group" "bagbeer_bot_cw" {
  name = "/ecs/christina-regina/bagbeer"
}

resource "aws_ecs_task_definition" "bagbeer_service_task_definition" {
  family                   = "service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = "${data.aws_iam_role.bagbeer_service_iam_role.arn}"
  container_definitions    = <<DEFINITION
[
  {
    "name": "bagbeer_task",
    "image": "${data.aws_ecr_repository.repository.repository_url}:latest",
    "cpu": 256,
    "memory": null,
    "memoryReservation": null,
    "essential": true,
    "portMappings": [{
      "containerPort": 3000,
      "hostPort": 3000,
      "protocol": "tcp"
    }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${aws_cloudwatch_log_group.bagbeer_bot_cw.name}",
        "awslogs-region": "eu-central-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-datetime-format": "%Y-%m-%d %H:%M:%S"
      }
    },
    "secrets": [
      {"name": "POLY_ID", "valueFrom": "${data.aws_ssm_parameter.poly_id.arn}"},
      {"name": "AGRO_API_TOKEN", "valueFrom": "${data.aws_ssm_parameter.api_token.arn}"}
    ]
  }
]
DEFINITION
}

resource "aws_ecs_service" "bagbeer_service" {
  name            = "bagbeer-service"
  cluster         = "${data.aws_ecs_cluster.cluster.id}"
  task_definition = "${aws_ecs_task_definition.bagbeer_service_task_definition.arn}"
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups = [data.aws_security_group.bagbeer_lb_sg.id]
    assign_public_ip = true
    subnets = [
      data.aws_subnet.subnet.id
    ]
  }

  load_balancer {
    target_group_arn = "${aws_alb_target_group.bagbeer_lb_target_group.arn}"
    container_name   = "bagbeer_task"
    container_port   = 3000
  }
}