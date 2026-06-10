-- All notes were backfilled to their owner between migrations
ALTER TABLE "Note" ALTER COLUMN "userId" SET NOT NULL;
