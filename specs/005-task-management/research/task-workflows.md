# Task Workflow Research

The app distinguishes durable campaign execution state from human planning. Task statuses therefore use their own configurable model rather than reusing CampaignStatus or ScheduleStatus. Explicit resource foreign keys preserve referential integrity and prevent unchecked polymorphic IDs. A simple completion flag provides completion behavior while allowing organization-specific names without exposing unnecessary workflow categories.

Accessible select-based movement is the MVP because it supports keyboard and mobile users without adding a drag-and-drop dependency. Contextual resource creation and schedule-aware due-date guidance are recommended follow-ups.
