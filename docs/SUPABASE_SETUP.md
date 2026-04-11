# Supabase Setup Guide

This guide will help you set up Supabase for the Novel Tracker application.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. Node.js and npm installed

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or create an account
4. Click "New Project"
5. Fill in the project details:
   - Name: `novel-tracker` (or your preferred name)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose a region close to you
6. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Your Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - Project URL
   - anon public key

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Run Database Setup

1. Go to SQL Editor in your Supabase dashboard
2. Click "New Query"
3. Copy the contents of `supabase/setup.sql`
4. Paste and click "Run" to execute

This will create:
- `profiles` table
- `novels` table
- `categories` table
- Row Level Security policies
- Triggers for automatic profile creation

## Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 6: Verify Setup

1. Start your development server:
```bash
npm run dev
```

2. You should see the login/register functionality
3. Try registering a new account
4. Check Supabase dashboard → Authentication → Users to verify the user was created

## Step 7: Test Database Connection

After logging in, try adding a novel. You should see it appear in:
- Supabase dashboard → Table Editor → novels

## Troubleshooting

### "Invalid API Key" error
- Check your `.env` file
- Ensure you're using the correct project URL and anon key
- Restart the dev server after updating `.env`

### "Row Level Security policy violated" error
- Make sure you ran the `setup.sql` script
- Check that RLS policies are created in Supabase dashboard → Authentication → Policies

### Data not syncing
- Check browser console for errors
- Verify you're logged in
- Check Supabase logs in the dashboard

## Next Steps

After setup is complete, you can:
1. Test the authentication flow
2. Add/edit/delete novels
3. Create categories
4. Verify data persistence in Supabase dashboard

## Security Notes

- Never commit `.env` file to version control
- The anon key is safe to use in client-side code
- Enable additional security features in production:
  - Email confirmation
  - Two-factor authentication
  - Rate limiting
