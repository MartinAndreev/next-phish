# UI Contract

`/tasks` shows an ordered horizontal board with status multi-select, search, create action, and status management. Cards expose title, priority, due/overdue state, safe relation link, edit action, and an accessible status select. Quick-add preselects the column.

Formik and shared Zod schemas own form state and validation. Statuses can be created and edited, with a completion checkbox and styled PrimeReact color picker. Task descriptions use the PrimeReact rich-text editor, due dates use the Calendar date/time picker, and selecting a relation type reveals a server-backed searchable resource dropdown. Loading uses a route skeleton. Desktop overflow remains horizontally scrollable; status movement does not require pointer drag-and-drop.
