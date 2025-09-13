# Firebase Password Reset Setup Guide

## 🎯 **Problem Solved**
This setup ensures that password reset flows use your app's custom validation rules instead of Firebase's default page.

## 📧 **Firebase Console Configuration**

### **1. Update Email Template**
Go to: https://console.firebase.google.com/project/top10-game-f9219/authentication/templates

**Password Reset Template:**
- **Sender name**: `Top10Game Team`
- **Subject**: `Reset your Top10Game password`
- **Message body**:
```html
<p>Hello,</p>

<p>We received a request to reset your Top10Game password for your %EMAIL% account.</p>

<p>Click the link below to reset your password:</p>
<p><a href="%LINK%" style="color: #007bff; text-decoration: none; background-color: #f8f9fa; padding: 10px 20px; border-radius: 5px; display: inline-block;">Reset Password</a></p>

<p>This link will expire in 1 hour for security reasons.</p>

<p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

<p>Best regards,<br>
The Top10Game Team</p>
```

### **2. Configure Custom Domain (Optional but Recommended)**
For better email deliverability and branding:

1. Go to Firebase Console → Authentication → Settings
2. Under "Authorized domains", add your custom domain
3. Configure custom email domain if desired

## 🔧 **App Configuration**

### **Deep Linking Setup**
The app now automatically handles Firebase password reset links and redirects users to the custom password reset screen.

### **Password Validation**
The custom reset screen enforces the same validation rules as signup:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

## ✅ **Benefits**

1. **Consistent Validation**: Same rules for signup and password reset
2. **Better UX**: Clear error messages and real-time validation
3. **Professional Branding**: Custom email templates
4. **Immediate Login**: Users can sign in right after reset
5. **Security**: Enforces strong password requirements

## 🧪 **Testing**

1. Request password reset from the app
2. Check email (including spam folder)
3. Click the reset link
4. You should be redirected to the custom reset screen
5. Try entering a weak password - it should show validation errors
6. Enter a strong password that meets all requirements
7. After reset, try signing in with the new password

## 🚀 **Result**

Users will now have a consistent password experience across signup and password reset, eliminating the issue where reset passwords don't meet app validation requirements.
