-- Rename the fixed "Squat 1RM" test type to "Back Squat 1RM" for clarity.
update test_types set name = 'Back Squat 1RM' where name = 'Squat 1RM' and coach_id is null;
