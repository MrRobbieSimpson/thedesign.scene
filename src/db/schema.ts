import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** DB enum values — includes legacy `build` (retyped to visual; kept for PG enum stability). */
export const CONTENT_TYPES = [
  "article",
  "thought",
  "visual",
  "build",
  "news",
  "post",
] as const;

/** Types creatable / filterable in the product UI (no dedicated Builds lane). */
export const PUBLIC_CONTENT_TYPES = [
  "article",
  "thought",
  "visual",
  "news",
  "post",
] as const;

export const contentTypeEnum = pgEnum("content_type", CONTENT_TYPES);

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "in-person",
  "hybrid",
  "remote",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
]);

export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "active",
  "unsubscribed",
]);

export const makers = pgTable("makers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull().unique(),
  bio: text("bio"),
  avatar: text("avatar"),
  website: text("website"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

/** Optional external links on a designer portfolio (LinkedIn, Are.na, …). */
export type ProfileLink = {
  label: string;
  url: string;
};

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  displayName: text("display_name"),
  handle: text("handle").unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  website: text("website"),
  xHandle: text("x_handle"),
  location: text("location"),
  /** IANA timezone resolved from location (e.g. Europe/London). Drives the header clock. */
  timezone: text("timezone"),
  /** Optional label+URL pairs shown on the portfolio. */
  links: jsonb("links").$type<ProfileLink[]>().notNull().default([]),
  makerId: uuid("maker_id").references(() => makers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const content = pgTable(
  "content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: contentTypeEnum("type").notNull(),
    title: text("title").notNull(),
    slug: text("slug").unique(),
    body: text("body"),
    readingTimeMinutes: integer("reading_time_minutes"),
    url: text("url"),
    excerpt: text("excerpt"),
    image: text("image"),
    status: contentStatusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    /** Short curation note shown on editor picks (“Why this is here”). */
    editorNote: text("editor_note"),
    makerId: uuid("maker_id").references(() => makers.id, {
      onDelete: "set null",
    }),
    authorProfileId: uuid("author_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    sourcePlatform: text("source_platform"),
    sourceUrl: text("source_url"),
    externalId: text("external_id"),
    authorHandle: text("author_handle"),
    authorName: text("author_name"),
    sourcePayload: jsonb("source_payload").$type<Record<string, unknown>>(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("content_source_external_uidx")
      .on(table.sourcePlatform, table.externalId)
      .where(
        sql`${table.sourcePlatform} is not null and ${table.externalId} is not null`
      ),
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    location: text("location"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    type: eventTypeEnum("type").notNull(),
    status: eventStatusEnum("status").notNull().default("draft"),
    sourcePlatform: text("source_platform"),
    sourceUrl: text("source_url"),
    externalId: text("external_id"),
    sourcePayload: jsonb("source_payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("events_source_external_uidx")
      .on(table.sourcePlatform, table.externalId)
      .where(
        sql`${table.sourcePlatform} is not null and ${table.externalId} is not null`
      ),
  ]
);

export const saves = pgTable(
  "saves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("saves_profile_content_uidx").on(
      table.profileId,
      table.contentId
    ),
  ]
);

/** Private “I sat with this” — attention, not a like. No public counts. */
export const sitsWith = pgTable(
  "sits_with",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sits_with_profile_content_uidx").on(
      table.profileId,
      table.contentId
    ),
  ]
);

export const scenes = pgTable("scenes", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const sceneItems = pgTable(
  "scene_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sceneId: uuid("scene_id")
      .notNull()
      .references(() => scenes.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => content.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("scene_items_scene_content_uidx").on(
      table.sceneId,
      table.contentId
    ),
  ]
);

export const guestTerms = pgTable("guest_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  intro: text("intro"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    /** Linked profile when subscribe requires sign-in — drives location-aware events. */
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    status: subscriberStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("newsletter_subscribers_email_uidx").on(table.email)]
);

export const makersRelations = relations(makers, ({ many, one }) => ({
  content: many(content),
  profile: one(profiles, {
    fields: [makers.id],
    references: [profiles.makerId],
  }),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  maker: one(makers, {
    fields: [content.makerId],
    references: [makers.id],
  }),
  authorProfile: one(profiles, {
    fields: [content.authorProfileId],
    references: [profiles.id],
  }),
  saves: many(saves),
  sitsWith: many(sitsWith),
  sceneItems: many(sceneItems),
}));

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  saves: many(saves),
  sitsWith: many(sitsWith),
  scenes: many(scenes),
  articles: many(content),
  guestTerms: many(guestTerms),
  newsletterSubscriptions: many(newsletterSubscribers),
  maker: one(makers, {
    fields: [profiles.makerId],
    references: [makers.id],
  }),
}));

export const newsletterSubscribersRelations = relations(
  newsletterSubscribers,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [newsletterSubscribers.profileId],
      references: [profiles.id],
    }),
  })
);

export const savesRelations = relations(saves, ({ one }) => ({
  profile: one(profiles, {
    fields: [saves.profileId],
    references: [profiles.id],
  }),
  content: one(content, {
    fields: [saves.contentId],
    references: [content.id],
  }),
}));

export const sitsWithRelations = relations(sitsWith, ({ one }) => ({
  profile: one(profiles, {
    fields: [sitsWith.profileId],
    references: [profiles.id],
  }),
  content: one(content, {
    fields: [sitsWith.contentId],
    references: [content.id],
  }),
}));

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [scenes.profileId],
    references: [profiles.id],
  }),
  items: many(sceneItems),
}));

export const sceneItemsRelations = relations(sceneItems, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneItems.sceneId],
    references: [scenes.id],
  }),
  content: one(content, {
    fields: [sceneItems.contentId],
    references: [content.id],
  }),
}));

export const guestTermsRelations = relations(guestTerms, ({ one }) => ({
  profile: one(profiles, {
    fields: [guestTerms.profileId],
    references: [profiles.id],
  }),
}));

export type Maker = typeof makers.$inferSelect;
export type NewMaker = typeof makers.$inferInsert;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Scene = typeof scenes.$inferSelect;
export type GuestTerm = typeof guestTerms.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type ContentType = (typeof CONTENT_TYPES)[number];
export type PublicContentType = (typeof PUBLIC_CONTENT_TYPES)[number];
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function isPublicContentType(value: string): value is PublicContentType {
  return (PUBLIC_CONTENT_TYPES as readonly string[]).includes(value);
}
