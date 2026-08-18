import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const CONTENT_TYPES = [
  "thought",
  "visual",
  "build",
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

export const content = pgTable(
  "content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: contentTypeEnum("type").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    excerpt: text("excerpt"),
    image: text("image"),
    status: contentStatusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    makerId: uuid("maker_id").references(() => makers.id, {
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

export const makersRelations = relations(makers, ({ many }) => ({
  content: many(content),
}));

export const contentRelations = relations(content, ({ one }) => ({
  maker: one(makers, {
    fields: [content.makerId],
    references: [makers.id],
  }),
}));

export type Maker = typeof makers.$inferSelect;
export type NewMaker = typeof makers.$inferInsert;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type ContentType = (typeof CONTENT_TYPES)[number];
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}
