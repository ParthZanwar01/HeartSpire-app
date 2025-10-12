# Vitamin Tracker Setup Guide

## Overview
The Vitamin Tracker feature allows women to track their daily vitamin intake with personalized reminders and a comprehensive tracking interface.

## Features
✅ Daily vitamin tracking with checkboxes
✅ Pre-populated list of essential prenatal vitamins
✅ Custom vitamin support
✅ Daily notification reminders
✅ Progress tracking
✅ Historical view of past vitamin intake
✅ Dark mode support
✅ Customizable notification times

## Installation Steps

### 1. Install Dependencies
Run the following command in your project directory:

```bash
cd /Users/parthzanwar/Desktop/HeartSpire-app/HeartSpire
npm install
```

### 2. iOS Setup

#### Install Pods
```bash
cd ios
pod install
cd ..
```

#### Permissions
The notification permission is already configured in `Info.plist`:
- `NSUserNotificationsUsageDescription` - For daily vitamin reminders

### 3. Android Setup

If you have an Android project, add the following to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

Also, add this inside the `<application>` tag:

```xml
<meta-data
    android:name="app.notifee.notification_channel_id"
    android:value="vitamin-reminders" />
```

### 4. Run the App

#### iOS
```bash
npm run ios
# or
npx react-native run-ios
```

#### Android
```bash
npm run android
# or
npx react-native run-android
```

## Usage

### Accessing the Vitamin Tracker
1. Open the HeartSpire app
2. On the main screen (Vitamin Finder), click the "📊 Track My Daily Vitamins" button
3. You'll be taken to the Vitamin Tracker page

### Tracking Vitamins
1. **Today Tab**: View and check off vitamins as you take them
   - Tap any vitamin to mark it as taken
   - Progress bar shows your daily completion
   - Vitamins are organized by category

2. **History Tab**: View your vitamin tracking history
   - See past days and which vitamins you took
   - Track your consistency over time

3. **Settings Tab**: Configure notifications
   - Toggle daily reminders on/off
   - Set your preferred reminder time (24-hour format)
   - Customize when you want to be reminded

### Adding Custom Vitamins
1. Go to the "Today" tab
2. Scroll to the bottom
3. Click "+ Add Custom Vitamin"
4. Enter the vitamin name and dosage (optional)
5. Click "Add"

### Setting Up Notifications
1. Go to the "Settings" tab
2. Toggle "Daily Reminders" ON
3. Grant notification permissions when prompted
4. Click "Change" to set your preferred reminder time
5. Enter the time in 24-hour format (e.g., 09:00 for 9 AM)
6. Click "Save Time"

The app will send you a daily notification at your chosen time to remind you to take your vitamins!

## Notification Details
- **Title**: "💊 Time for Your Vitamins!"
- **Message**: "Don't forget to take your daily vitamins. Your health matters!"
- **Frequency**: Daily, repeating at the same time each day
- **Permissions**: Automatically requested when you enable notifications

## Data Persistence
All your data is stored locally on your device using AsyncStorage:
- Daily vitamin check-ins
- Custom vitamins you've added
- Notification settings and preferences
- Historical tracking data

## Included Vitamins
The app comes pre-loaded with these essential vitamins:

**Essential:**
- Prenatal Multivitamin
- Folic Acid (400-800 mcg)
- Iron (27 mg)
- Calcium (1000 mg)
- Vitamin D3 (600-800 IU)
- Omega-3 DHA (200-300 mg)

**B-Complex:**
- Vitamin B12 (2.6 mcg)
- Vitamin B6 (1.9 mg)

**Antioxidants:**
- Vitamin C (85 mg)
- Vitamin E (15 mg)

**Minerals:**
- Magnesium (350 mg)
- Zinc (11 mg)

## Troubleshooting

### Notifications Not Working
1. Check device notification settings for the app
2. Ensure notifications are enabled in the Settings tab
3. Try toggling notifications off and on again
4. Restart the app

### Data Not Saving
1. Check that the app has storage permissions
2. Restart the app
3. Ensure you're not in low storage mode

### iOS Notification Permission Denied
Go to iPhone Settings → HeartSpire → Notifications → Enable "Allow Notifications"

### Android Notification Permission Denied
Go to Phone Settings → Apps → HeartSpire → Notifications → Enable notifications

## Support
For any issues or questions, please reach out to the development team.

