-- Migrate existing free-text position values to the new label set. Prop,
-- Hooker, Lock, and Fullback are unchanged; the rest get relabeled.
update profiles set position = 'Flankers' where position = 'Flanker';
update profiles set position = '8' where position = 'Number 8';
update profiles set position = 'Scrum Half' where position = 'Scrum-half';
update profiles set position = 'Fly Half' where position = 'Fly-half';
update profiles set position = 'Center' where position = 'Centre';
update profiles set position = 'Winger' where position = 'Wing';
