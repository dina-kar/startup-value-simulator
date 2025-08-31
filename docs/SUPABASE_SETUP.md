# Supabase Setup Guide for Startup Value Simulator

This guide will walk you through setting up Supabase for the Startup Value Simulator application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `startup-value-simulator` (or your preferred name)
   - **Database Password**: Generate a secure password and save it
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (usually takes 1-2 minutes)

## 2. Get Your Environment Variables

Once your project is ready:

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (looks like `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

## 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual Supabase project URL and anon key.

## 4. Set Up Database Schema

Go to the SQL Editor in your Supabase dashboard and run the following SQL to create the required tables:

```sql
-- Enable Row Level Security
alter table if exists public.scenarios enable row level security;
alter table if exists public.shared_scenarios enable row level security;

-- Create scenarios table
create table if not exists public.scenarios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  company_name text not null,
  founding_date date not null,
  initial_shares bigint not null,
  esop_pool_percentage numeric(5,2) not null,
  founders jsonb not null default '[]'::jsonb,
  funding_rounds jsonb not null default '[]'::jsonb,
  exit_scenarios jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shared_scenarios table
create table if not exists public.shared_scenarios (
  id uuid default gen_random_uuid() primary key,
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  share_token text unique not null,
  is_public boolean default false not null,
  can_view boolean default true not null,
  can_copy boolean default false not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists scenarios_user_id_idx on public.scenarios(user_id);
create index if not exists scenarios_updated_at_idx on public.scenarios(updated_at desc);
create index if not exists shared_scenarios_token_idx on public.shared_scenarios(share_token);
create index if not exists shared_scenarios_scenario_id_idx on public.shared_scenarios(scenario_id);

-- Set up Row Level Security policies

-- Scenarios policies
create policy "Users can only see their own scenarios"
  on public.scenarios for select
  using (auth.uid() = user_id);

create policy "Users can only insert their own scenarios"
  on public.scenarios for insert
  with check (auth.uid() = user_id);

create policy "Users can only update their own scenarios"
  on public.scenarios for update
  using (auth.uid() = user_id);

create policy "Users can only delete their own scenarios"
  on public.scenarios for delete
  using (auth.uid() = user_id);

-- Shared scenarios policies
create policy "Scenario owners can manage shares"
  on public.shared_scenarios for all
  using (
    exists (
      select 1 from public.scenarios 
      where scenarios.id = shared_scenarios.scenario_id 
      and scenarios.user_id = auth.uid()
    )
  );

create policy "Anyone can view public shared scenarios"
  on public.shared_scenarios for select
  using (is_public = true and (expires_at is null or expires_at > now()));

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger for scenarios table
drop trigger if exists handle_scenarios_updated_at on public.scenarios;
create trigger handle_scenarios_updated_at
  before update on public.scenarios
  for each row execute function public.handle_updated_at();
```

## 5. Configure Authentication

### Enable Email Authentication

1. Go to Authentication → Settings in your Supabase dashboard
2. Under "Auth Providers", make sure "Email" is enabled
3. Configure the following settings:
   - **Enable email confirmations**: Toggle based on your preference
   - **Enable email change confirmations**: Recommended to keep enabled
   - **Enable secure password change**: Recommended to keep enabled

### Configure Email Templates (Optional)

1. Go to Authentication → Email Templates
2. Customize the templates for:
   - Confirm signup
   - Reset password
   - Magic link
   - Email change

### Set up Redirect URLs

1. Go to Authentication → URL Configuration
2. Add your site URL to "Site URL": `http://localhost:3000` (for development)
3. Add redirect URLs:
   - `http://localhost:3000/**` (for development)
   - `https://your-domain.com/**` (for production)

## 6. Test the Connection

Run your application to test the connection:

```bash
npm run dev
```

You should be able to:
1. Visit the home page at `http://localhost:3000`
2. Click "Get Started" to go to signup
3. Create an account
4. Be redirected to the builder page
5. Create and save scenarios

## 7. Environment Variables for Production

When deploying to production, make sure to:

1. Set the same environment variables in your deployment platform
2. Update the Site URL in Supabase to your production domain
3. Add your production domain to the redirect URLs

## 8. Database Backups (Recommended)

Set up automatic backups:

1. Go to Settings → Database
2. Enable "Point in Time Recovery" if available in your plan
3. Consider upgrading to Pro plan for better backup options

## Troubleshooting

### Common Issues

1. **"Auth session missing!" error**
   - Make sure environment variables are set correctly
   - Check that RLS policies are set up properly
   - Ensure user is authenticated before making database calls

2. **Connection refused errors**
   - Verify your SUPABASE_URL is correct
   - Check that your project is active and not paused

3. **Permission denied errors**
   - Check RLS policies are set up correctly
   - Verify the user is authenticated
   - Make sure the user_id foreign key is properly set

4. **Environment variables not loading**
   - Make sure `.env.local` is in the project root
   - Restart your development server
   - Check variable names have `NEXT_PUBLIC_` prefix for client-side usage

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Check your browser's developer console for error messages

## Security Notes

1. **Never commit your `.env.local` file** - it contains sensitive keys
2. The anon key is safe to use in client-side code - it only provides access to what RLS policies allow
3. Always use Row Level Security policies to protect your data
4. Regularly rotate your database password
5. Monitor your project's usage in the Supabase dashboard

Your Supabase setup is now complete! The application should be able to authenticate users and persist their scenarios to the database.
