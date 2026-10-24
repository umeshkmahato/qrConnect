# ADR-001: Host the API on ECS Fargate

Status: accepted.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| ECS Fargate | No node management, per-task IAM, scales with ALB, familiar Docker model | Slightly higher per-unit cost than EC2 at scale |
| EC2 + ASG | Cheapest steady-state | Patching, AMIs, more moving parts, slower deploys |
| EKS | Maximum flexibility | Unjustified operational complexity for a single service |
| App Runner | Simplest | Fewer network controls, weaker private-subnet story |

## Decision

ECS Fargate. The workload is a single modular monolith; Fargate gives private-subnet
placement, security groups, task-scoped IAM roles and Secrets Manager integration
without node management. Revisit if sustained load makes EC2/Graviton economics
materially better, or if additional services justify EKS.
