# Guide: Uploading VitaMom to App Store Connect via Xcode

## Prerequisites

Before you can upload your app, make sure you have:
1. ✅ Apple Developer Account (Individual or Organization)
2. ✅ App created in App Store Connect with bundle ID: `com.vitamom.app`
3. ✅ Signing certificates and provisioning profiles set up

## Step-by-Step Process

### 1. Prepare Your App for Distribution

First, ensure your app is built for release:

```bash
# From the project root directory
cd ios
pod install
cd ..
```

### 2. Open Xcode

Open your Xcode workspace (not just the project):

```bash
open ios/VitaMom.xcworkspace
```

**Important**: Always open the `.xcworkspace` file, NOT the `.xcodeproj` file when using CocoaPods.

### 3. Configure Signing & Capabilities

1. In Xcode, select your project in the navigator (top item "VitaMom")
2. Select the "VitaMom" target
3. Go to **"Signing & Capabilities"** tab
4. Ensure:
   - **Team**: Select your Apple Developer Team (Team ID: QB736BJ6TF)
   - **Bundle Identifier**: `com.vitamom.app`
   - **Automatically manage signing**: Checked (recommended)
   - **Provisioning Profile**: Should auto-generate if signing is automatic

### 4. Update Build Version (if needed)

1. Still in the target settings, go to **"General"** tab
2. Check:
   - **Version**: Should be `1.0.0` (from Info.plist)
   - **Build**: Should be at least `1` (currently set to `1`)
   - If you've submitted before, increment the Build number

### 5. Select Distribution Scheme

1. At the top of Xcode, next to the Play/Stop buttons
2. Click on the scheme selector (likely says "VitaMom > iPhone 15 Pro")
3. Select **"Any iOS Device (arm64)"** or your connected device
4. Make sure it does NOT say "iOS Simulator"

### 6. Archive Your App

1. In Xcode menu: **Product → Archive**
2. Wait for the build to complete (this may take several minutes)
3. The Organizer window should open automatically showing your archive

**Troubleshooting Archive:**
- If "Archive" is grayed out: Make sure you selected "Any iOS Device" not a simulator
- If build fails: Check for errors in the build log and fix them first

### 7. Upload to App Store Connect

Once the archive is created:

1. In the Organizer window, select your archive
2. Click **"Distribute App"** button
3. Select distribution method:
   - Choose **"App Store Connect"** → Click **Next**
4. Choose upload options:
   - **"Upload"** → Click **Next**
5. Select distribution options:
   - **"Automatically manage signing"** (recommended) → Click **Next**
6. Review and click **"Upload"**
7. Wait for validation and upload to complete

**What happens next:**
- Xcode will validate your app
- Upload to App Store Connect (usually takes 5-15 minutes)
- You'll see a success message when done

### 8. Submit for Review in App Store Connect

After upload completes:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **"My Apps"** → Select **"VitaMom"**
3. The build will appear under **"TestFlight"** tab first (for internal testing)
4. To submit for App Store review:
   - Go to **"+ Version"** or select existing version
   - Fill in all required information:
     - Screenshots (required for different device sizes)
     - Description
     - Keywords
     - Support URL
     - Privacy Policy URL (required)
     - Category
     - Age rating
   - Select your uploaded build
   - Answer the Export Compliance questions
   - Submit for review

## Important Notes

### Bundle Identifier
Your bundle ID is: `com.vitamom.app`
Make sure this matches exactly in:
- `app.json` (line 19)
- App Store Connect app listing
- Xcode project settings

### Version Information
- Current Version: `1.0.0` (CFBundleShortVersionString)
- Build Number: `1` (CFBundleVersion)

For future updates, increment the Build number each time you submit.

### Common Issues & Solutions

**Issue: "No signing certificate found"**
- Solution: In Xcode → Preferences → Accounts → Add your Apple ID → Download Manual Profiles

**Issue: "Bundle identifier already exists"**
- Solution: Make sure you've created the app in App Store Connect first with this bundle ID

**Issue: "Invalid Bundle" errors**
- Solution: Check that Info.plist has all required keys and values are correct

**Issue: Archive button is disabled**
- Solution: Make sure you selected "Any iOS Device" in the scheme selector, not a simulator

### Alternative: Using EAS Build (Expo's Build Service)

If you prefer using Expo's build service:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure

# Build for iOS App Store
eas build --platform ios --profile production
```

Then download the `.ipa` file and upload it using Transporter app or Xcode.

## Next Steps After Upload

1. **Wait for Processing**: Apple needs 10-30 minutes to process your build
2. **Internal Testing**: Test via TestFlight (if you set it up)
3. **Submit for Review**: Complete App Store listing and submit
4. **Review Status**: Check status in App Store Connect
5. **Release**: Once approved, release to App Store!

---

**Need Help?**
- [Apple Developer Documentation](https://developer.apple.com/documentation)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Expo Submission Guide](https://docs.expo.dev/submit/ios/)

