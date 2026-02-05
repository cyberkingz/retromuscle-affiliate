-- Seed reference data + demo records for the MVP dashboards.

insert into public.package_definitions (tier, quota_videos, monthly_credits)
values
  (10, 10, 0),
  (20, 20, 25),
  (30, 30, 38),
  (40, 40, 50)
on conflict (tier)
do update set
  quota_videos = excluded.quota_videos,
  monthly_credits = excluded.monthly_credits,
  updated_at = timezone('utc', now());

insert into public.mix_definitions (name, distribution, positioning)
values
  ('VOLUME', '{"OOTD":0.4,"TRAINING":0.35,"BEFORE_AFTER":0.2,"SPORTS_80S":0,"CINEMATIC":0.05}'::jsonb, 'Max volume performance. Direction artistique minimale.'),
  ('EQUILIBRE', '{"OOTD":0.3,"TRAINING":0.3,"BEFORE_AFTER":0.25,"SPORTS_80S":0.1,"CINEMATIC":0.05}'::jsonb, 'Mix equilibre performance + image de marque.'),
  ('PREMIUM_80S', '{"OOTD":0.2,"TRAINING":0.25,"BEFORE_AFTER":0.2,"SPORTS_80S":0.2,"CINEMATIC":0.15}'::jsonb, 'Direction artistique forte, cout creatif plus eleve.'),
  ('TRANSFO_HEAVY', '{"OOTD":0.2,"TRAINING":0.25,"BEFORE_AFTER":0.4,"SPORTS_80S":0.1,"CINEMATIC":0.05}'::jsonb, 'Focus transformations Before/After.')
on conflict (name)
do update set
  distribution = excluded.distribution,
  positioning = excluded.positioning,
  updated_at = timezone('utc', now());

insert into public.video_rates (video_type, rate_per_video, is_placeholder)
values
  ('OOTD', 100, false),
  ('TRAINING', 95, true),
  ('BEFORE_AFTER', 120, true),
  ('SPORTS_80S', 140, true),
  ('CINEMATIC', 180, true)
on conflict (video_type)
do update set
  rate_per_video = excluded.rate_per_video,
  is_placeholder = excluded.is_placeholder,
  updated_at = timezone('utc', now());

insert into public.creators (
  id,
  handle,
  display_name,
  email,
  whatsapp,
  country,
  address,
  followers,
  social_links,
  package_tier,
  default_mix,
  status,
  start_date,
  contract_signed_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '@emma_fit',
    'Emma Rivier',
    'emma@retromuscle-creators.com',
    '+33 6 12 00 00 01',
    'FR',
    '25 Rue Saint-Maur, Paris',
    14300,
    '{"tiktok":"https://www.tiktok.com/@emma_fit","instagram":"https://www.instagram.com/emma_fit"}'::jsonb,
    20,
    'VOLUME',
    'actif',
    '2025-11-08',
    '2025-11-10T09:40:00.000Z'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '@marc_gym',
    'Marc Dupont',
    'marc@retromuscle-creators.com',
    '+33 6 12 00 00 02',
    'FR',
    '12 Avenue Jean Jaures, Lyon',
    29100,
    '{"tiktok":"https://www.tiktok.com/@marc_gym","instagram":"https://www.instagram.com/marc_gym"}'::jsonb,
    30,
    'EQUILIBRE',
    'actif',
    '2025-10-14',
    '2025-10-16T12:00:00.000Z'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '@julie_fit',
    'Julie Martin',
    'julie@retromuscle-creators.com',
    '+32 499 00 00 03',
    'BE',
    '5 Rue des Tongres, Bruxelles',
    8900,
    '{"tiktok":"https://www.tiktok.com/@julie_fit","instagram":"https://www.instagram.com/julie_fit"}'::jsonb,
    10,
    'TRANSFO_HEAVY',
    'candidat',
    '2026-01-03',
    '2026-01-07T10:20:00.000Z'
  )
on conflict (id)
do update set
  handle = excluded.handle,
  display_name = excluded.display_name,
  email = excluded.email,
  whatsapp = excluded.whatsapp,
  country = excluded.country,
  address = excluded.address,
  followers = excluded.followers,
  social_links = excluded.social_links,
  package_tier = excluded.package_tier,
  default_mix = excluded.default_mix,
  status = excluded.status,
  start_date = excluded.start_date,
  contract_signed_at = excluded.contract_signed_at,
  updated_at = timezone('utc', now());

insert into public.monthly_tracking (
  id,
  month,
  creator_id,
  package_tier,
  quota_total,
  mix_name,
  quotas,
  delivered,
  deadline,
  payment_status,
  paid_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '2026-02',
    '11111111-1111-4111-8111-111111111111',
    20,
    20,
    'VOLUME',
    '{"OOTD":8,"TRAINING":7,"BEFORE_AFTER":4,"SPORTS_80S":0,"CINEMATIC":1}'::jsonb,
    '{"OOTD":8,"TRAINING":7,"BEFORE_AFTER":4,"SPORTS_80S":0,"CINEMATIC":0}'::jsonb,
    '2026-02-28',
    'en_cours',
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '2026-02',
    '22222222-2222-4222-8222-222222222222',
    30,
    30,
    'EQUILIBRE',
    '{"OOTD":9,"TRAINING":9,"BEFORE_AFTER":8,"SPORTS_80S":3,"CINEMATIC":1}'::jsonb,
    '{"OOTD":9,"TRAINING":9,"BEFORE_AFTER":8,"SPORTS_80S":3,"CINEMATIC":1}'::jsonb,
    '2026-02-28',
    'a_faire',
    null
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '2026-02',
    '33333333-3333-4333-8333-333333333333',
    10,
    10,
    'TRANSFO_HEAVY',
    '{"OOTD":2,"TRAINING":3,"BEFORE_AFTER":4,"SPORTS_80S":1,"CINEMATIC":0}'::jsonb,
    '{"OOTD":2,"TRAINING":3,"BEFORE_AFTER":4,"SPORTS_80S":1,"CINEMATIC":0}'::jsonb,
    '2026-02-28',
    'paye',
    '2026-02-01T07:30:00.000Z'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    '2026-01',
    '11111111-1111-4111-8111-111111111111',
    20,
    20,
    'VOLUME',
    '{"OOTD":8,"TRAINING":7,"BEFORE_AFTER":4,"SPORTS_80S":0,"CINEMATIC":1}'::jsonb,
    '{"OOTD":8,"TRAINING":7,"BEFORE_AFTER":4,"SPORTS_80S":0,"CINEMATIC":1}'::jsonb,
    '2026-01-31',
    'paye',
    '2026-02-05T09:00:00.000Z'
  )
on conflict (id)
do update set
  month = excluded.month,
  creator_id = excluded.creator_id,
  package_tier = excluded.package_tier,
  quota_total = excluded.quota_total,
  mix_name = excluded.mix_name,
  quotas = excluded.quotas,
  delivered = excluded.delivered,
  deadline = excluded.deadline,
  payment_status = excluded.payment_status,
  paid_at = excluded.paid_at,
  updated_at = timezone('utc', now());

insert into public.videos (
  id,
  monthly_tracking_id,
  creator_id,
  video_type,
  file_url,
  duration_seconds,
  resolution,
  file_size_mb,
  status,
  created_at
)
values
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'CINEMATIC',
    'https://cdn.retromuscle.local/emma/cinematic-1.mp4',
    45,
    '1080x1920',
    224,
    'pending_review',
    '2026-02-04T07:10:00.000Z'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '33333333-3333-4333-8333-333333333333',
    'TRAINING',
    'https://cdn.retromuscle.local/julie/training-2.mp4',
    32,
    '1080x1920',
    155,
    'pending_review',
    '2026-02-04T06:50:00.000Z'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    '33333333-3333-4333-8333-333333333333',
    'BEFORE_AFTER',
    'https://cdn.retromuscle.local/julie/ba-4.mp4',
    38,
    '1080x1080',
    162,
    'pending_review',
    '2026-02-04T06:15:00.000Z'
  )
on conflict (id)
do update set
  monthly_tracking_id = excluded.monthly_tracking_id,
  creator_id = excluded.creator_id,
  video_type = excluded.video_type,
  file_url = excluded.file_url,
  duration_seconds = excluded.duration_seconds,
  resolution = excluded.resolution,
  file_size_mb = excluded.file_size_mb,
  status = excluded.status,
  created_at = excluded.created_at;

insert into public.rushes (
  id,
  monthly_tracking_id,
  creator_id,
  file_name,
  file_size_mb,
  file_url,
  created_at
)
values
  (
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'raw-gym-angle-a.mov',
    410,
    'https://cdn.retromuscle.local/emma/raw-gym-angle-a.mov',
    '2026-02-03T11:00:00.000Z'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'raw-transition-b.mov',
    370,
    'https://cdn.retromuscle.local/emma/raw-transition-b.mov',
    '2026-02-03T11:15:00.000Z'
  )
on conflict (id)
do update set
  monthly_tracking_id = excluded.monthly_tracking_id,
  creator_id = excluded.creator_id,
  file_name = excluded.file_name,
  file_size_mb = excluded.file_size_mb,
  file_url = excluded.file_url,
  created_at = excluded.created_at;
