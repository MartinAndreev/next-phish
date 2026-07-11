# Event contract

Feature 002 produces no runtime event and changes no event producer, consumer,
queue, webhook, audit record, or telemetry payload. Updating Markdown is the only
state change. MCP calls retain the event/queue behavior of their existing delegates
(for example, page import may return a job); this guide must not define new event
semantics.
