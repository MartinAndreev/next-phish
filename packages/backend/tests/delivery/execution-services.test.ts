import { describe, expect, it } from "vitest";
import {
  calculateScheduledAt,
  canTransitionDelivery,
  generateLogicalMessageId,
  generateTrackingRef,
  getPublicContentUrl,
  maxNegativeSeverity,
  networkContains,
  nextOccurrenceAfter,
  normalizeNetwork,
  resolveClientIp,
  renderDeliveryHtml,
  rewriteTrackedLinks,
  createWebhookSignature,
  verifyWebhookSignature,
  selectScheduleSource,
  DistributedRateLimiterService,
} from "../../src/delivery";

describe("execution identities", () => {
  it("creates neutral random 12 character references", () => {
    const refs = new Set(Array.from({ length: 2_000 }, generateTrackingRef));
    expect(refs.size).toBe(2_000);
    for (const ref of refs) expect(ref).toMatch(/^[0-9A-Za-z]{12}$/);
  });

  it("creates opaque RFC 5322 message ids and rejects identifying domains", () => {
    expect(generateLogicalMessageId("mail.customer.example")).toMatch(
      /^<[a-z0-9_-]+@mail\.customer\.example>$/,
    );
    expect(() => generateLogicalMessageId("phish.example")).toThrow();
  });

  it("requires a configured neutral public content URL", () => {
    const previous = process.env.PUBLIC_CONTENT_URL;
    delete process.env.PUBLIC_CONTENT_URL;
    expect(() => getPublicContentUrl()).toThrow("PUBLIC_CONTENT_URL");
    process.env.PUBLIC_CONTENT_URL = "http://localhost:3001/";
    expect(getPublicContentUrl()).toBe("http://localhost:3001");
    if (previous === undefined) delete process.env.PUBLIC_CONTENT_URL;
    else process.env.PUBLIC_CONTENT_URL = previous;
  });
});

describe("delivery policy", () => {
  it("calculates deterministic pacing", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    expect(calculateScheduledAt(start, 5, { mode: "BLAST" })).toEqual(start);
    expect(
      calculateScheduledAt(start, 5, {
        mode: "DRIP",
        emailsPerMinute: 2,
      }).toISOString(),
    ).toBe("2026-01-01T00:02:30.000Z");
    expect(
      calculateScheduledAt(start, 5, {
        mode: "BATCH",
        batchSize: 2,
        batchIntervalMinutes: 10,
      }).toISOString(),
    ).toBe("2026-01-01T00:20:00.000Z");
  });

  it("allows only explicit transitions and monotonic severity", () => {
    expect(canTransitionDelivery("QUEUED", "DISPATCHING")).toBe(true);
    expect(canTransitionDelivery("SENT", "QUEUED")).toBe(false);
    expect(maxNegativeSeverity("SUBMITTED", "OPENED")).toBe("SUBMITTED");
    expect(maxNegativeSeverity("OPENED", "CLICKED")).toBe("CLICKED");
  });
});

describe("schedule source selection", () => {
  const sources = [
    { campaignId: "one", position: 0 },
    { campaignId: "two", position: 1 },
  ];

  it("exhausts a deck without reusing a source", () => {
    expect(
      selectScheduleSource({
        scheduleId: "schedule",
        strategy: "DECK",
        sources,
        occurrenceCount: 0,
        shuffleDeck: false,
      }),
    ).toEqual({ sourceCampaignId: "one", deckExhausted: false });
    expect(
      selectScheduleSource({
        scheduleId: "schedule",
        strategy: "DECK",
        sources,
        occurrenceCount: 1,
        shuffleDeck: false,
      }),
    ).toEqual({ sourceCampaignId: "two", deckExhausted: true });
    expect(
      selectScheduleSource({
        scheduleId: "schedule",
        strategy: "DECK",
        sources,
        occurrenceCount: 2,
        shuffleDeck: false,
      }).sourceCampaignId,
    ).toBeNull();
  });

  it("avoids consecutive random repetition", () => {
    expect(
      selectScheduleSource({
        scheduleId: "schedule",
        strategy: "RANDOM",
        sources,
        occurrenceCount: 2,
        previousSourceCampaignId: "one",
        shuffleDeck: false,
        randomIndex: () => 0,
      }).sourceCampaignId,
    ).toBe("two");
  });
});

describe("calendar recurrence", () => {
  it("falls back to the final calendar day", () => {
    const next = nextOccurrenceAfter(new Date("2026-01-31T09:00:00.000Z"), {
      frequency: "MONTHLY",
      timezone: "UTC",
      localTimeMinutes: 9 * 60,
      dayOfMonth: 31,
    });
    expect(next.toISOString()).toBe("2026-02-28T09:00:00.000Z");
  });

  it("uses compatible DST gap and overlap disambiguation", () => {
    const gap = nextOccurrenceAfter(new Date("2026-03-01T07:30:00.000Z"), {
      frequency: "WEEKLY",
      timezone: "America/New_York",
      localTimeMinutes: 2 * 60 + 30,
      weekday: 0,
    });
    expect(gap.toISOString()).toBe("2026-03-08T07:30:00.000Z");

    const overlap = nextOccurrenceAfter(new Date("2026-10-25T05:30:00.000Z"), {
      frequency: "WEEKLY",
      timezone: "America/New_York",
      localTimeMinutes: 90,
      weekday: 0,
    });
    expect(overlap.toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });
});

describe("tracked content", () => {
  it("renders the configured page path and an invisible tracking pixel", () => {
    const html = renderDeliveryHtml({
      templateHtml:
        '<p>Hello {{.FirstName}}</p><a href="{{.URL}}">Continue</a>',
      publicContentUrl: "http://localhost:3001",
      pagePath: "account/login",
      trackingPixel: true,
      recipient: {
        firstName: "A",
        lastName: "User",
        email: "a@example.test",
        position: null,
        trackingRef: "AbCdEf123456",
      },
    });
    expect(html).toContain("<p>Hello A</p>");
    expect(html).toContain(
      'href="http://localhost:3001/account/login?ref=AbCdEf123456"',
    );
    expect(html).toContain(
      '<img src="http://localhost:3001/p.gif?ref=AbCdEf123456"',
    );
    expect(html).toContain('width="1" height="1" style="display:none"');
  });

  it("maps destinations to immutable short server-side identifiers", () => {
    const result = rewriteTrackedLinks(
      '<a href="https://example.org/path?q=1">Open</a>',
      "https://content.example.com",
    );
    expect(result.html).toContain(
      'href="https://content.example.com/r/0001?ref={{trackingRef}}"',
    );
    expect(result.links).toEqual([
      {
        linkId: "0001",
        destinationUrl: "https://example.org/path?q=1",
      },
    ]);
    expect(result.html).not.toContain("example.org");
  });
});

describe("distributed rate limiting", () => {
  it("returns the shared Redis window decision", async () => {
    const redis = {
      eval: async () => [0, 4_000],
    };
    const limiter = new DistributedRateLimiterService(redis as never);
    await expect(
      limiter.consume({ key: "organization:one", max: 10, durationMs: 60_000 }),
    ).resolves.toEqual({ allowed: false, retryAfterMs: 4_000 });
  });
});

describe("provider webhook security", () => {
  it("validates signatures and rejects stale replay timestamps", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const timestamp = String(Math.floor(now.getTime() / 1_000));
    const rawBody = '{"event":"delivered"}';
    const signature = createWebhookSignature("secret", timestamp, rawBody);
    expect(
      verifyWebhookSignature({
        secret: "secret",
        timestamp,
        rawBody,
        signature,
        now,
      }),
    ).toBe(true);
    expect(
      verifyWebhookSignature({
        secret: "secret",
        timestamp,
        rawBody,
        signature,
        now: new Date(now.getTime() + 301_000),
      }),
    ).toBe(false);
    expect(
      verifyWebhookSignature({
        secret: "other",
        timestamp,
        rawBody,
        signature,
        now,
      }),
    ).toBe(false);
  });
});

describe("network handling", () => {
  it("normalizes ranges and mapped IPv4", () => {
    expect(normalizeNetwork("192.168.1.42/24").canonical).toBe(
      "192.168.1.0/24",
    );
    expect(normalizeNetwork("::ffff:192.168.1.42").canonical).toBe(
      "192.168.1.42/32",
    );
    expect(networkContains("192.168.1.0/24", "192.168.1.42")).toBe(true);
  });

  it("ignores forwarded headers from untrusted peers", () => {
    expect(
      resolveClientIp({
        directAddress: "203.0.113.8",
        forwardedFor: "10.0.0.5",
        trustedProxyNetworks: ["192.0.2.0/24"],
      }),
    ).toBe("203.0.113.8");
    expect(
      resolveClientIp({
        directAddress: "192.0.2.8",
        forwardedFor: "198.51.100.4, 192.0.2.7",
        trustedProxyNetworks: ["192.0.2.0/24"],
      }),
    ).toBe("198.51.100.4");
  });
});
