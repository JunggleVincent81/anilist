-- AN-165A: enum-only migration (must commit before the subsequent constraint migration).
-- PostgreSQL disallows using a newly added enum label in the same transaction.
-- NO production/development database application is authorized.
ALTER TYPE "EditorialTransitionAction" ADD VALUE 'APPROVE';
