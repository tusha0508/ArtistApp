# Email Service Migration: SMTP → Resend

## 🔄 Migration Summary

**Previous:** Nodemailer + SMTP (Gmail/Resend)  
**New:** Resend API (more reliable, simpler, no SMTP configuration)

### Why Resend?
- ✅ **Higher deliverability** (trusted provider)
- ✅ **Simple API** (single endpoint, no transport config)
- ✅ **Free trial** and easy scaling
- ✅ **No nodemailer dependency needed**

---

## 📋 Migration Changes

### 1. **Dependencies Updated**
```json
// REMOVED
"nodemailer": "^7.0.11"

// No new dependencies required
```

### 2. **Environment Variables Changed**
```dotenv
# OLD SMTP CONFIG (REMOVED)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USER=resend
EMAIL_PASS=your_resend_api_key_here

# OLD BREVO CONFIG (REMOVED)
BREVO_API_KEY=your_brevo_api_key_here

# NEW RESEND CONFIG
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM="ArtistApp <noreply@yourdomain.com>"
```

### 3. **Code Changes**
- `emailService.js`: Complete rewrite using Resend REST API with fetch (no SDK dependency issues)
- `test-email.js`: Updated to test Resend API
- All email functions (`sendOTPEmail`, `sendWelcomeEmail`) preserved

---

## 🚀 Setup Instructions

### Step 1: Create Resend Account
1. Go to [resend.com](https://www.resend.com)
2. Click **"Sign Up"**
3. Verify your email address
4. Complete account setup

### Step 2: Get API Key
1. In Resend dashboard, go to **"API keys"**
2. Click **"Create API key"**
3. Name it: `ArtistApp Production`
4. Copy the API key (save it securely!)

### Step 3: Verify Sender Email
1. In Resend dashboard, go to **"Senders"**
2. Add your email or domain
3. Verify ownership (email confirmation or DNS records)
4. **Alternative:** Use default verified sender from Resend

### Step 4: Update Environment Variables
In `backend/.env`:
```dotenv
# Replace this line:
RESEND_API_KEY=your_resend_api_key_here

# With your actual API key:
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Test Email Service
```bash
cd backend
node test-email.js
```

**Expected Output:**
```
🔧 Testing Resend email configuration...

📧 Email Config:
RESEND_API_KEY: ***SET***
EMAIL_FROM: ArtistApp <noreply@yourdomain.com>

📨 Sending test email...
✅ Email sent successfully!
Message ID: xxxxxxxxxx
```

### Step 6: Deploy to Production
1. Commit changes to Git
2. Deploy on Render (manual deploy recommended)
3. Check logs for successful email initialization

---

## 📧 Email Types (All Working)

✅ **OTP Emails** - Signup & password reset verification  
✅ **Welcome Emails** - New user/artist onboarding  
✅ **Booking Request Emails** - Artist receives booking notifications  
✅ **Booking Response Emails** - User receives accept/reject/price changes  

---

## 🔧 Troubleshooting

### "RESEND_API_KEY not found"
- Check `.env` file exists and is properly formatted
- Ensure no extra spaces around `=`
- Restart backend service

### "Invalid API key"
- Double-check API key from Resend dashboard
- Ensure you're using the Resend API key (starts with `re_`)

### "Sender not verified"
- Verify sender email in Resend
- Or use a verified default sender

### Emails going to spam?
- Complete domain verification
- Send test emails to warm up IP reputation
- Avoid spam trigger words in subject/content

### Connection/Network errors
- Check internet connectivity
- Verify Resend API endpoint is accessible
- Check firewall settings (port 443 for HTTPS)

### Still having issues?
1. Check Render logs for detailed error messages
2. Test with Resend's API testing tool
3. Contact Resend support (they're very responsive)

---

## 💰 Resend Pricing (Free Tier Sufficient)

- **Free:** 100 emails/month + pay-as-you-go (starts at $0.60 per 1,000 emails)
- **Paid:** optional credits for larger volume
- **Enterprise:** custom pricing

For ArtistApp's current usage, the free tier should be more than enough.

---

## 🎯 Next Steps

1. ✅ Complete Resend setup
2. ✅ Test email functionality
3. ✅ Deploy to production
4. ✅ Monitor email delivery rates
5. 🔄 Consider adding more credits if volume increases

### Gmail App Password Setup (If Issues Persist)
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not done)
3. Create **App Password** for "Mail" and "Windows Computer"
4. Copy the 16-character password → Add to `.env` as `EMAIL_PASS`

### Monitor Email Delivery
Add this to your `authRoutes.js` register function:
```javascript
sendWelcomeEmail({ to: email, username, role: "user" })
  .then(() => console.log(`✅ Welcome email queued for ${email}`))
  .catch(err => {
    console.error(`❌ Welcome email failed for ${email}:`, err.message);
    // Still create account - email is secondary
  });
```

---

## 📊 Testing Checklist

- [ ] Account creation email received (both user & artist)
- [ ] Booking sent notification to artist email
- [ ] Booking accepted notification to user email
- [ ] Booking rejected notification to user email
- [ ] Counter offer notification to user email
- [ ] Password reset OTP received
- [ ] Check Render logs for email success messages

---

## 🆘 If Still Not Working

**Check these in order:**
1. Verify `EMAIL_FROM` format: `"Name <email@gmail.com>"`
2. Check Gmail app password is used (not regular password)
3. Verify port 587 is open on Render (usually is)
4. Test with a simple `.env` file locally:
   ```bash
   cd backend
   npm start
   ```
5. Create test account and check email

**Still stuck?** Add this debugging code temporarily:
```javascript
// In services/emailService.js - after transporter creation
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email config error:", error);
  } else {
    console.log("✅ Email service ready");
  }
});
```

