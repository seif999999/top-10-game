# Feedback Email Setup Guide

The feedback feature requires an email service to send emails automatically. Here are the setup options:

## Option 1: EmailJS (Recommended - Free, Easy Setup)

1. Sign up at https://www.emailjs.com/ (free tier: 200 emails/month)
2. Create an Email Service (Gmail, Outlook, etc.)
3. Create an Email Template with these variables:
   - `to_email` - recipient email
   - `from_email` - sender email
   - `from_name` - sender name
   - `subject` - email subject
   - `message` - email body
   - `reply_to` - reply-to email
4. Get your Service ID, Template ID, and Public Key
5. Add to `.env`:
   ```
   EXPO_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
   EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
   EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
   ```

## Option 2: Formspree (Free, No Setup Required)

1. Go to https://formspree.io/
2. Create a new form
3. Set the form to send emails to: `gameapptop10@gmail.com`
4. Get your form endpoint (e.g., `https://formspree.io/f/xxxxx`)
5. Add to `.env`:
   ```
   EXPO_PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/your_form_id
   ```

## Option 3: Custom API Endpoint

Create a backend endpoint that accepts POST requests:
- Endpoint: Your API URL
- Method: POST
- Body: `{ to, subject, body, fromEmail, fromName }`
- Response: `{ success: true }`

Add to `.env`:
```
EXPO_PUBLIC_EMAIL_API_ENDPOINT=https://your-api.com/send-email
```

## Quick Setup (EmailJS - 5 minutes)

1. Go to https://www.emailjs.com/
2. Sign up (free)
3. Add Gmail service
4. Create template (make sure {{message}} is prominently displayed - this is what the user wrote):
   ```
   To: {{to_email}}
   From: {{from_name}} <{{from_email}}>
   Subject: {{subject}}
   
   {{message}}
   
   Reply to: {{reply_to}}
   ```
   
   **Important:** The `{{message}}` variable contains the user's feedback text. Make sure your template displays it prominently. The message will include the user's text followed by their name and email at the bottom.
5. Copy IDs to `.env` file
6. Restart app
