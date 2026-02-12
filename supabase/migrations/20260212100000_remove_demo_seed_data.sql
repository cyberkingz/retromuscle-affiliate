-- Remove demo/fake seed data for production launch.
-- Deletes the three fake creators and all their associated records.
-- Reference data (packages, mixes, rates) is preserved.

-- Delete demo rush assets
delete from public.rushes
where id in (
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc2'
);

-- Delete demo video assets
delete from public.videos
where id in (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3'
);

-- Delete demo monthly tracking records
delete from public.monthly_tracking
where id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4'
);

-- Delete demo creators
delete from public.creators
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333'
);

-- Mark all video rates as confirmed (no longer placeholders)
update public.video_rates
set is_placeholder = false,
    updated_at = timezone('utc', now())
where is_placeholder = true;
