INSERT INTO "Category" ("id", "name", "slug", "description", "isActive", "createdAt", "updatedAt")
VALUES
 ('4a0272e8-a78b-44bb-9097-2ca4bc0a1001', 'Proficiency Courses in French', 'proficiency-courses-in-french', '3-month Beginner French, 3-month Intermediate French, and 3-month Advanced French.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('4a0272e8-a78b-44bb-9097-2ca4bc0a1002', 'Specialized Tutoring', 'specialized-tutoring', 'Focused French conversation, examination, academic, and professional tutoring.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 ('4a0272e8-a78b-44bb-9097-2ca4bc0a1003', 'Research Assistance', 'research-assistance', 'Proposal, literature review, methodology, analysis, editing, and referencing guidance.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
