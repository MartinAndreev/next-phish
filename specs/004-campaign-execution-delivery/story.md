# Story

## Problem

Persisted schedules do not currently execute, campaign occurrences are not created by workers, and campaigns do not have a durable recipient-level delivery or activity history. A retryable asynchronous implementation must withstand duplicate jobs, worker crashes, provider throttling, and high recipient volume without duplicating campaigns, recipient results, or known-safe email submissions.

## User

Organization members who operate authorized security-awareness simulations and need scheduled campaigns to start reliably, send at the configured pace, and produce trustworthy recipient-level results.

## Desired outcome

A database-led execution pipeline uses BullMQ for transport and PostgreSQL for durable state. Each schedule occurrence, campaign recipient, queue publication, delivery attempt, high-level campaign event, and technical delivery event has an explicit idempotency boundary. Recipient links use a short neutral `ref` value, externally visible artifacts do not reveal the platform or simulation purpose, known scanner networks can be ignored per organization, and ambiguous provider outcomes are surfaced rather than silently risking duplicate delivery.
