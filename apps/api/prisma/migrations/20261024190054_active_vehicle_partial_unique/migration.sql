-- Enforce at most one non-terminal vehicle record per (org, registrationNumber).
-- Historical (REJECTED/DEACTIVATED) rows are preserved; uniqueness applies only
-- to ACTIVE and PENDING_APPROVAL records.
CREATE UNIQUE INDEX vehicles_one_active_per_reg
  ON "vehicles" ("orgId", "registrationNumber")
  WHERE "status" IN ('ACTIVE', 'PENDING_APPROVAL');
