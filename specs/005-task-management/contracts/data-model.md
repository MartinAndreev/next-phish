# Data Model Contract

`TaskStatus` belongs to one organization and is unique by normalized name and position. It has a `marksTaskDone` flag and a validated six-digit hex color selected with the styled PrimeReact color picker.

`Task` belongs to one organization and composite-references a status in that same organization. Creator is retained, assignee is optional, and at most one explicit resource FK may be populated. Resource FKs use `ON DELETE SET NULL`; organization deletion cascades.

Indexes support board status ordering, assignee filters, and due-date queries. Application checks enforce tenant ownership in addition to foreign-key existence.
