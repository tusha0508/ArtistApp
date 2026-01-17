# 🚀 Quick Email Test - Check If Emails Are Working

## Run This Now:

When you get the OTP verification screen but don't receive the email, run these checks:

---

## ✅ Check 1: Backend Terminal Messages

When you sign up, **watch the backend terminal** for these messages:

### Look for:
```
✅ Email service is ready to send messages
✅ Email sent successfully to your-email@example.com
```

### If you see this instead:
```
❌ Email service connection failed: ...
⚠️ Failed to send signup OTP email: ...
```

**👉 Copy this error message and share it with me.**

---

## ✅ Check 2: Check Email Spam/Junk Folder

**Gmail:**
- Spam folder (left sidebar)
- Search for: `tushajoshi9@gmail.com`
- If found: Click "Mark as not spam"

**Outlook/Yahoo/Others:**
- Check Junk/Spam folder
- Mark as "Not junk"

---

## ✅ Check 3: Test Credentials

In backend `.env`, verify these are exactly correct:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tushajoshi9@gmail.com
EMAIL_PASS=nozjqdohdpigzjgs  (or your app password)
```

**If using Gmail:**
- Don't use your regular password
- Use a 16-character "App Password" from Google Account
- Get it from: https://myaccount.google.com/apppasswords
- Make sure 2-Step Verification is ON first

---

## ✅ Check 4: Check OTP Value

On the OTP verification screen:

1. Don't have the email? ✅ Click "Resend OTP" button
2. Wait 60 seconds for button to activate
3. Click "Resend OTP"
4. Check email again (spam folder too!)

---

## 🎯 Most Likely Causes (in order):

1. **Email went to spam folder** ← Check here first! ⭐
2. **Gmail app password needed** ← Get from Google Account
3. **Email credentials wrong in .env** ← Double-check exactly
4. **Backend email service failed** ← Check terminal error messages

---

## 💡 What Happens Behind the Scenes:

```
You signup
   ↓
Backend creates account (not verified yet)
   ↓
Backend generates 6-digit OTP
   ↓
Backend tries to send email
   ├─ ✅ If success: "✅ Email sent to..."
   └─ ❌ If failure: "❌ Failed to send..." or "⚠️ Failed to send..."
   ↓
Frontend shows OTP verification screen
   ↓
You should receive email with OTP code
```

---

## 🔧 If Email Shows in Backend But You Don't Get It:

**Most common reason:** Gmail spam filter

**Solution:**
1. Check Gmail spam folder
2. Click the email
3. Click "Mark as not spam"
4. Refresh spam filter
5. Future emails will arrive in inbox

---

## 📱 Next Steps:

1. **Try signing up again** (with different email if needed)
2. **Check spam folder immediately**
3. **If found:** Mark as not spam
4. **If not found:** Check backend terminal for error
5. **Share the error** so we can fix it

---

## ⚡ TL;DR:

- OTP screen appeared? ✅ Good!
- No email received? Check spam folder first! 📧
- Backend error? Copy the error message 📋
- Still stuck? We'll debug together! 🔧

**The email system is working - just might need a small fix! Let me know! 💪**
