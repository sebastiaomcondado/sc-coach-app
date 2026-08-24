alter table program_templates
  add column day_of_week smallint check (day_of_week is null or day_of_week between 0 and 6);

alter table template_exercise_phases
  add column start_week smallint check (start_week is null or start_week >= 1),
  add column end_week smallint check (end_week is null or end_week >= 1);

create index if not exists profiles_squad_idx on profiles (squad) where squad is not null;
