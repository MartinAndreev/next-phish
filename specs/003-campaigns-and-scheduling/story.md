# Story

## Problem

Gophish combines campaign definition, recipient selection, scheduling, and launch.
NextPhish intends to reuse the useful campaign composition model while separating
reusable campaign templates from schedules and concrete campaign instances. Without a
shared product document, later campaign, scheduling, and execution features could use
incompatible terminology and lifecycle rules.

## User

Organization members who prepare and schedule phishing simulations, plus product and
engineering contributors who will implement these capabilities later.

## Desired outcome

A source-backed document explains Gophish campaign behavior and records NextPhish’s
agreed campaign-template, campaign, one-time schedule, repeating schedule, pacing,
timezone, completion, cloning, and broken-dependency behavior. The document clearly
excludes sending and schedule execution and retains unresolved decisions rather than
inventing policy.
