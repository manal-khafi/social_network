-- Add canonical direct conversation pair columns
ALTER TABLE "Conversation" ADD COLUMN "direct_user_a_id" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "direct_user_b_id" TEXT;

-- Foreign keys (optional; keep on delete as SET NULL)
ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_direct_user_a_id_fkey"
FOREIGN KEY ("direct_user_a_id") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_direct_user_b_id_fkey"
FOREIGN KEY ("direct_user_b_id") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill (A,B) pair for 1:1 conversations with exactly 2 participants
WITH pairs AS (
  SELECT
    conversation_id,
    MIN(user_id) AS a,
    MAX(user_id) AS b,
    COUNT(*)     AS cnt
  FROM "ConversationParticipant"
  GROUP BY conversation_id
)
UPDATE "Conversation" c
SET
  "direct_user_a_id" = p.a,
  "direct_user_b_id" = p.b
FROM pairs p
WHERE c.id = p.conversation_id
  AND c.is_group = false
  AND p.cnt = 2;

-- Merge duplicates: move messages + call logs into a canonical conversation per (a,b)
WITH pairs AS (
  SELECT
    conversation_id,
    MIN(user_id) AS a,
    MAX(user_id) AS b,
    COUNT(*)     AS cnt
  FROM "ConversationParticipant"
  GROUP BY conversation_id
), canon AS (
  SELECT DISTINCT ON (p.a, p.b)
    p.a,
    p.b,
    p.conversation_id AS canonical_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.a IS NOT NULL
    AND p.b IS NOT NULL
  ORDER BY p.a, p.b, c.created_at ASC, c.id ASC
), dups AS (
  SELECT
    p.conversation_id AS duplicate_id,
    canon.canonical_id AS canonical_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  JOIN canon ON canon.a = p.a AND canon.b = p.b
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.conversation_id <> canon.canonical_id
)
UPDATE "Message" m
SET conversation_id = d.canonical_id
FROM dups d
WHERE m.conversation_id = d.duplicate_id;

WITH pairs AS (
  SELECT
    conversation_id,
    MIN(user_id) AS a,
    MAX(user_id) AS b,
    COUNT(*)     AS cnt
  FROM "ConversationParticipant"
  GROUP BY conversation_id
), canon AS (
  SELECT DISTINCT ON (p.a, p.b)
    p.a,
    p.b,
    p.conversation_id AS canonical_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.a IS NOT NULL
    AND p.b IS NOT NULL
  ORDER BY p.a, p.b, c.created_at ASC, c.id ASC
), dups AS (
  SELECT
    p.conversation_id AS duplicate_id,
    canon.canonical_id AS canonical_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  JOIN canon ON canon.a = p.a AND canon.b = p.b
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.conversation_id <> canon.canonical_id
)
UPDATE "CallLog" cl
SET conversation_id = d.canonical_id
FROM dups d
WHERE cl.conversation_id = d.duplicate_id;

-- Hide duplicate conversations by marking participants deleted/archived
WITH pairs AS (
  SELECT
    conversation_id,
    MIN(user_id) AS a,
    MAX(user_id) AS b,
    COUNT(*)     AS cnt
  FROM "ConversationParticipant"
  GROUP BY conversation_id
), canon AS (
  SELECT DISTINCT ON (p.a, p.b)
    p.a,
    p.b,
    p.conversation_id AS canonical_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.a IS NOT NULL
    AND p.b IS NOT NULL
  ORDER BY p.a, p.b, c.created_at ASC, c.id ASC
), dups AS (
  SELECT
    p.conversation_id AS duplicate_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  JOIN canon ON canon.a = p.a AND canon.b = p.b
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.conversation_id <> canon.canonical_id
)
UPDATE "ConversationParticipant" cp
SET
  is_deleted = true,
  deleted_at = NOW(),
  is_archived = true,
  archived_at = NOW()
FROM dups d
WHERE cp.conversation_id = d.duplicate_id;

-- Null-out pair keys on duplicates so we can enforce uniqueness
WITH pairs AS (
  SELECT
    conversation_id,
    MIN(user_id) AS a,
    MAX(user_id) AS b,
    COUNT(*)     AS cnt
  FROM "ConversationParticipant"
  GROUP BY conversation_id
), canon AS (
  SELECT DISTINCT ON (p.a, p.b)
    p.a,
    p.b,
    p.conversation_id AS canonical_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.a IS NOT NULL
    AND p.b IS NOT NULL
  ORDER BY p.a, p.b, c.created_at ASC, c.id ASC
), dups AS (
  SELECT
    p.conversation_id AS duplicate_id
  FROM pairs p
  JOIN "Conversation" c ON c.id = p.conversation_id
  JOIN canon ON canon.a = p.a AND canon.b = p.b
  WHERE c.is_group = false
    AND p.cnt = 2
    AND p.conversation_id <> canon.canonical_id
)
UPDATE "Conversation" c
SET
  "direct_user_a_id" = NULL,
  "direct_user_b_id" = NULL
FROM dups d
WHERE c.id = d.duplicate_id;

-- Enforce uniqueness for direct conversations (group chats have NULLs)
CREATE UNIQUE INDEX "Conversation_direct_user_pair_unique"
ON "Conversation"("direct_user_a_id", "direct_user_b_id");
