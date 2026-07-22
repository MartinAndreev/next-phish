ALTER TABLE "task_status" ALTER COLUMN "colorToken" SET DEFAULT '#64748b';

UPDATE "task_status"
SET "colorToken" = CASE "colorToken"
  WHEN 'neutral' THEN '#64748b'
  WHEN 'blue' THEN '#29b8ff'
  WHEN 'indigo' THEN '#5c73ff'
  WHEN 'violet' THEN '#7b5cff'
  WHEN 'cyan' THEN '#15e5d4'
  ELSE "colorToken"
END
WHERE "colorToken" IN ('neutral', 'blue', 'indigo', 'violet', 'cyan');
