# Public Tracking Contract

## Reference

- Query parameter name is `ref`.
- Value is a cryptographically random 12-character Base58 or Base62 string.
- It is stored uniquely on one campaign recipient result.
- It is unrelated to database IDs and recipient data.
- It is redacted from logs, traces, metrics, and error reports.

Illustrative shape:

```text
https://neutral.customer-domain.example/path?ref=Ab3kP9wQ7mXs
```

The hostname/path above are illustrative only. Production values must be customer-controlled and neutral.

## Neutrality

No URL, hostname, header, Message-ID, HTML comment, asset name, response body, error page, provider metadata, or User-Agent introduced by this feature may identify the platform or reveal simulation intent.

Valid, invalid, expired, cancelled, and ignored requests return the same externally observable validity shape.

## Link behavior

- A click carries `ref` and a short immutable link ID.
- Link ID resolves to a destination captured in the immutable campaign message manifest.
- Arbitrary request-provided destinations are never followed.
- The handler records an accepted non-ignored `CLICKED` event before returning the neutral redirect.

## Pixel behavior

- Returns the same small valid image for all reference outcomes.
- Uses no-store/no-cache headers.
- Records `OPENED` only for a valid, non-ignored result.

## Submission behavior

- `ref` must resolve to the campaign recipient and immutable campaign page.
- Ignored-network requests are served normally without event or aggregate mutation.
- Accepted requests create `SUBMITTED` transactionally with the monotonic projection update.
- Raw passwords are not persisted by default.

## Report behavior

- Valid reports create `REPORTED` and set the independent reported projection.
- Organization ignored networks do not suppress reports.

## Ignored networks

- Exact IPv4/IPv6 addresses and CIDR ranges are configured per organization.
- Open, click, and submission handlers resolve organization first, normalize the trusted client IP, and apply CIDR matching before event insertion.
- Matching requests create no campaign event and no recipient projection update.

## Proxy trust

- Direct peer is authoritative unless it is a deployment-configured trusted proxy.
- Forwarded headers from untrusted peers are ignored.
- Trusted chains resolve the first untrusted client according to one documented algorithm.
- IPv4-mapped IPv6 is normalized consistently.
- Trusted proxy configuration is deployment-level and distinct from organization ignored networks.
