-- ==================================================
-- Seed — local development
-- ==================================================
-- Runs automatically on `supabase db reset`.
--
-- Creates the minimum needed for the app to function against a real
-- database: an organization, a login, one job with agent guidance, a
-- campaign with a known code, and the four partner companies.
--
-- LOCAL ONLY. The password here is deliberately weak and the ids are
-- fixed so tests and links stay stable across resets. Never run this
-- against a hosted project.
-- ==================================================

-- Fixed ids so /j/HRAG1 and the demo login keep working after every reset.
do $$
declare
  v_org_id   uuid := '11111111-1111-1111-1111-111111111111';
  v_user_id  uuid := '22222222-2222-2222-2222-222222222222';
  v_job_id   uuid := '33333333-3333-3333-3333-333333333333';
  v_agent_id uuid := '44444444-4444-4444-4444-444444444444';
begin

  -- ── Organization ────────────────────────────────────────────────────
  insert into organizations (id, name, slug, plan)
  values (v_org_id, 'HR AG', 'hr-ag', 'free')
  on conflict (id) do nothing;

  -- ── Login ───────────────────────────────────────────────────────────
  -- Inserting straight into auth.users is supported locally. The
  -- handle_new_user trigger reads organization_id out of
  -- raw_user_meta_data, so it must be present here.
  -- The token columns must be '' and not NULL: GoTrue scans them into Go
  -- strings, and a NULL kills every password sign-in with a 500
  -- ("converting NULL to string is unsupported"). Their column default is
  -- NULL, so they have to be set explicitly here.
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current,
    email_change, phone_change, phone_change_token
  )
  values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'asaf@hr-ag.local',
    crypt('hrag1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'organization_id', v_org_id::text,
      'full_name',       'אסף',
      'role',            'super_admin'
    ),
    now(), now(),
    '', '', '', '', '', '', ''
  )
  on conflict (id) do nothing;

  -- The trigger normally creates this. Insert defensively in case the
  -- conflict clause above skipped it on a re-run.
  insert into recruiter_profiles (id, organization_id, full_name, role)
  values (v_user_id, v_org_id, 'אסף', 'super_admin')
  on conflict (id) do nothing;

  -- Needed for password grant to work against a local stack.
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    created_at, updated_at, last_sign_in_at
  )
  values (
    gen_random_uuid(), v_user_id, v_user_id::text, 'email',
    jsonb_build_object('sub', v_user_id::text, 'email', 'asaf@hr-ag.local', 'email_verified', true),
    now(), now(), now()
  )
  on conflict do nothing;

  -- ── Agent profile ───────────────────────────────────────────────────
  -- Wording matches what Asaf described: verify depth, do not collect
  -- claims, and stay off compensation.
  insert into agent_profiles (
    id, organization_id, name, persona_name, objective, tone, guidelines,
    max_questions, is_default
  )
  values (
    v_agent_id, v_org_id,
    'סוכן — ברירת מחדל', 'עמי',
    'לוודא שהמועמד באמת עבד עם מה שרשם בקורות החיים, ולא רק שמע עליו. לבדוק עומק אמיתי דרך שאלות ספציפיות על פרויקטים שהוא הזכיר.',
    'friendly',
    'אל תדון בשכר או בתנאים. אם המועמד שואל, אמור שזה ייסגר בשלב הבא של התהליך.',
    6, true
  )
  on conflict (id) do nothing;

  -- ── Job ─────────────────────────────────────────────────────────────
  -- The Yael Group pilot role (job 25395). Easy to overstate on paper and
  -- impossible to verify from a CV, which is exactly why it is the first test.
  insert into jobs (
    id, organization_id, created_by, agent_profile_id,
    title, slug, description, requirements, status,
    location, employment_type, screening_questions, ai_instructions
  )
  values (
    v_job_id, v_org_id, v_user_id, v_agent_id,
    'רכז/ת שירות ואדמיניסטרציה',
    'service-admin-coordinator',
    'מענה קו ראשון לפניות תלמידים במכללה לסייבר, וניהול תפעולי שוטף. התפקיד כולל עבודה מול מספר מערכות במקביל, תיאום בין גורמים, וטיפול בפניות מקצה לקצה.',
    array[
      'ניסיון של שנה בבק-אופיס או אדמיניסטרציה',
      'סדר וארגון ויכולת ריבוי משימות',
      'שליטה מלאה ביישומי מחשב — Office ובמיוחד Excel',
      'יכולת ביטוי גבוהה בכתב ובעל פה'
    ],
    'active', 'לוד', 'full_time',
    -- Phrased to require evidence rather than a yes. "Do you know Excel"
    -- is answered yes by everyone and tells us nothing.
    '[
      {"id":"q1","question":"ספר על טבלה או קובץ שבנית שמישהו אחר השתמש בו. מה היה בו ולמה נבנה?","type":"open","required":true,"weight":9},
      {"id":"q2","question":"תאר מצב שבו טיפלת בכמה פניות במקביל. איך החלטת במה לטפל קודם?","type":"open","required":true,"weight":8},
      {"id":"q3","question":"באיזו מערכת בק-אופיס עבדת, ומה עשית בה ביום עבודה טיפוסי?","type":"open","required":true,"weight":8},
      {"id":"q4","question":"ספר על פנייה מסובכת שהגיעה אליך ואיך סגרת אותה.","type":"open","required":false,"weight":7}
    ]'::jsonb,
    'שים דגש על אימות בפועל: כל אחד כותב "שליטה באקסל". בקש דוגמה קונקרטית שרק מי שבאמת עבד יוכל לתת — איזה נתונים, מה הפלט, מי השתמש.'
  )
  on conflict (id) do nothing;

  -- ── Campaign ────────────────────────────────────────────────────────
  -- Fixed code so /j/HRAG1 survives a reset.
  insert into campaigns (
    organization_id, job_id, code, channel, ad_copy, landing_url, is_active
  )
  values (
    v_org_id, v_job_id, 'HRAG1', 'direct', '',
    'http://localhost:8090/j/HRAG1', true
  )
  on conflict (code) do nothing;

  -- ── Partner companies ───────────────────────────────────────────────
  -- Figures verified from their own pages on 05/08; see
  -- _SHARED/PARTNER_PROGRAMS.md. careers_url and the submission channel are
  -- deliberately separate fields — conflating them was the original
  -- misunderstanding.
  insert into client_companies (
    organization_id, name, slug, website, careers_url,
    submission_method, submission_config,
    bonus_amount_ils, bonus_delay_months, bonus_notes, status
  )
  values
    (v_org_id, 'קבוצת יעל', 'yael-group', 'https://yaelgroup.com', 'https://yaelgroup.com/jobs/',
     'email', '{"to":"bonus@yaelsoft.com","required_fields":["referrer_name","referrer_phone","referrer_email","candidate_cv"]}'::jsonb,
     null, null, 'סכום לא פורסם בעמוד. ההפניה במייל; המשרות בעמוד קריירה נפרד (391 משרות ב-05/08).', 'active'),

    (v_org_id, 'קורן טק / Log-On', 'koren-tec', 'https://b.log-on.com', 'https://yaelgroup.com/jobs/',
     'web_form', '{"url":"https://b.log-on.com/lp/friend-bring-friend.html","notes":"הדבקת קו\"ח + אישור דיוור"}'::jsonb,
     4000, 4, 'תוכנית 4X4: ₪4,000 אחרי 4 חודשי העסקה. Give Us A Name: ₪1,000 אחרי 3. מטה: ₪1,500 אחרי 3.', 'active'),

    (v_org_id, 'אדם טוטאל', 'adam-total', 'https://adamtotal.co.il', null,
     'web_form', '{"notes":"טופס + לינק נפרד לפרטי הממליץ — אם המועמד מדלג, ההפניה לא נרשמת"}'::jsonb,
     null, null, 'הבונוס לא מפורסם. האטריביוציה שלהם תלויה בכך שהמועמד יזכור למלא את פרטי הממליץ.', 'active'),

    (v_org_id, 'SoftwareOne', 'softwareone', 'https://www.softwareone.com', 'https://www.softwareone.com/en/careers/external-referral-program',
     'manual', '{"notes":"החזיר 429 בבקשה אוטומטית אחת — לבדוק ידנית בלבד"}'::jsonb,
     null, null, 'תנאי התוכנית לא נבדקו. האתר חוסם איסוף אוטומטי.', 'active')
  on conflict (organization_id, slug) do nothing;

end $$;
