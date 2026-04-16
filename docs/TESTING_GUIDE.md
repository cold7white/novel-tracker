# Testing Guide - Supabase Integration

## Prerequisites

Before testing, ensure you have:
1. Installed dependencies: `npm install`
2. Created a Supabase project
3. Run the database setup script (`supabase/setup.sql`)
4. Configured environment variables in `.env`

## Phase 1: Authentication Testing

### Test Registration

1. Start the dev server: `npm run dev`
2. Open the application in your browser
3. Click "登录 / 注册" button in the header
4. Click "立即注册" to switch to registration mode
5. Enter a test email and password (min 6 characters)
6. Click "注册"

**Expected Results:**
- Form should submit without errors
- You should be logged in automatically
- Your email should appear in the header
- A "退出登录" button should appear

**Verification:**
- Go to your Supabase dashboard
- Navigate to Authentication → Users
- You should see your new user listed

### Test Login

1. Click "退出登录" to logout
2. Click "登录 / 注册" again
3. Enter the same email and password
4. Click "登录"

**Expected Results:**
- You should be logged in
- Your previous data should load (if any)

### Test Session Persistence

1. Login with your account
2. Refresh the page (F5)
3. Close and reopen the browser

**Expected Results:**
- You should remain logged in
- Your email should still be displayed

## Phase 2: Data Sync Testing

### Test Creating Novels (Logged In)

1. Make sure you're logged in
2. Click "+ 添加小说"
3. Fill in the novel details:
   - Title: "Test Novel"
   - Author: "Test Author"
   - Status: "在读"
   - Rating: 4
   - Tags: "test"
4. Click "添加"

**Expected Results:**
- Novel should appear in the list
- No error messages in console

**Verification:**
- Go to Supabase dashboard
- Navigate to Table Editor → novels
- You should see the new novel with your data

### Test Editing Novels (Logged In)

1. Right-click on the novel you just created
2. Select "编辑"
3. Change the title to "Updated Test Novel"
4. Click "确定"

**Expected Results:**
- Novel title should update
- Changes should reflect in the UI

**Verification:**
- Check Supabase dashboard → novels table
- The title should be updated

### Test Deleting Novels (Logged In)

1. Right-click on the novel
2. Select "删除"
3. Confirm deletion

**Expected Results:**
- Novel should disappear from the list
- No error messages

**Verification:**
- Check Supabase dashboard → novels table
- The novel should be deleted

### Test Categories

1. Click "+ 新建分类" in the sidebar
2. Enter category name: "测试分类"
3. Click "添加"

**Expected Results:**
- New category should appear in sidebar
- No error messages

**Verification:**
- Check Supabase dashboard → categories table
- New category should be listed

## Phase 3: Offline Mode Testing

### Test Local Storage (Logged Out)

1. Logout from your account
2. Create a new novel
3. Edit the novel
4. Create a new category

**Expected Results:**
- All operations should work normally
- Data should persist in localStorage

### Test Data Migration

1. Login with your account
2. Observe the data

**Expected Results:**
- Your local data should remain visible
- New data should sync to Supabase
- No data loss should occur

## Phase 4: Multi-Device Testing (Optional)

### Test Cross-Device Sync

1. Login on Device A
2. Create some novels
3. Login with the same account on Device B
4. Check if data appears

**Expected Results:**
- Data from Device A should appear on Device B
- Changes on either device should sync

## Common Issues and Solutions

### Issue: "Invalid API Key"
**Solution:**
- Check your `.env` file
- Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Restart the dev server after updating `.env`

### Issue: "Row Level Security policy violated"
**Solution:**
- Ensure you've run `supabase/setup.sql`
- Check that RLS policies are created in Supabase dashboard
- Verify you're logged in with the correct user

### Issue: Data not syncing to Supabase
**Solution:**
- Open browser console (F12)
- Check for error messages
- Verify your network connection
- Ensure you're logged in

### Issue: "User already registered"
**Solution:**
- This is expected if you try to register with the same email
- Use the login form instead
- Or delete the user from Supabase dashboard to re-register

### Issue: Session not persisting
**Solution:**
- Check browser localStorage is enabled
- Clear browser cache and cookies
- Try using incognito/private browsing mode

## Performance Testing

### Test with Large Datasets

1. Create 50+ novels
2. Test filtering and sorting
3. Test search functionality

**Expected Results:**
- UI should remain responsive
- No significant lag
- Filters should work correctly

## Security Testing

### Test User Isolation

1. Create two different accounts
2. Login with Account A, create novels
3. Logout and login with Account B

**Expected Results:**
- Account B should NOT see Account A's novels
- Each user should only see their own data

## Success Criteria

All tests pass if:
- ✅ Registration works
- ✅ Login works
- ✅ Session persists
- ✅ CRUD operations work with Supabase
- ✅ Data persists across sessions
- ✅ Offline mode works
- ✅ Users are isolated (can't see each other's data)
- ✅ No data loss during sync

## Next Steps

After all tests pass:
1. Deploy to production
2. Set up custom domain (optional)
3. Enable email confirmation (optional)
4. Set up backup strategies
5. Monitor Supabase usage and limits
