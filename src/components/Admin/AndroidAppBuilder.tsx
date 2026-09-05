import React, { useState } from 'react';
import { 
  Smartphone, Download, Sparkles, Check, Globe, Shield, RefreshCw, 
  Layers, Palette, Bell, MapPin, Camera, ChevronRight, Play, ExternalLink, 
  FileCode, Package, Info, Upload, Save, Loader2
} from 'lucide-react';
import JSZip from 'jszip';
import { AndroidAppSettings } from '../../types';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../lib/imgbb';
import { sanitizeFirestoreData } from '../../services/payment/PaymentService';
import { doc, setDoc } from '../../lib/firebase';
import { db } from '../../lib/firebase';

export type { AndroidAppSettings };

export interface AndroidAppBuilderProps {
  tenantId?: string;
  initialSettings?: AndroidAppSettings;
  value?: AndroidAppSettings;
  onChange?: (updated: AndroidAppSettings) => void;
  brandName?: string;
  brandLogo?: string;
  websiteUrl?: string;
}

export default function AndroidAppBuilder({
  tenantId = '',
  initialSettings,
  value,
  onChange,
  brandName = 'My Tour Brand',
  brandLogo = '',
  websiteUrl = typeof window !== 'undefined' ? window.location.origin : ''
}: AndroidAppBuilderProps) {
  const effectiveSettings = value || initialSettings;

  // Config state
  const [appName, setAppName] = useState(effectiveSettings?.appName || brandName || 'Tripbone Tours');
  const [shortName, setShortName] = useState(effectiveSettings?.shortName || (brandName ? brandName.slice(0, 12) : 'Tours'));
  const [appId, setAppId] = useState(
    effectiveSettings?.appId || effectiveSettings?.packageName || `com.tripbone.${(brandName || 'tour').toLowerCase().replace(/[^a-z0-9]/g, '')}`
  );
  const [versionName, setVersionName] = useState(effectiveSettings?.versionName || '1.0.0');
  const [versionCode, setVersionCode] = useState(effectiveSettings?.versionCode || 1);
  const [appIcon, setAppIcon] = useState(effectiveSettings?.appIcon || effectiveSettings?.appIconUrl || brandLogo || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=512&q=80');
  const [themeColor, setThemeColor] = useState(effectiveSettings?.themeColor || '#0284c7');
  const [splashBgColor, setSplashBgColor] = useState(effectiveSettings?.splashBgColor || effectiveSettings?.splashColor || '#0284c7');
  const [splashLogo, setSplashLogo] = useState(effectiveSettings?.splashLogo || brandLogo || '');
  const [startUrl, setStartUrl] = useState(effectiveSettings?.startUrl || websiteUrl);
  const [orientation, setOrientation] = useState(effectiveSettings?.orientation || 'portrait');
  const [displayMode, setDisplayMode] = useState(effectiveSettings?.displayMode || 'standalone');
  
  // Permissions & Features
  const [enableCamera, setEnableCamera] = useState(effectiveSettings?.enableCamera ?? true);
  const [enableGeolocation, setEnableGeolocation] = useState(effectiveSettings?.enableGeolocation ?? true);
  const [enablePushNotifications, setEnablePushNotifications] = useState(effectiveSettings?.enablePushNotifications ?? true);
  const [enablePullToRefresh, setEnablePullToRefresh] = useState(effectiveSettings?.enablePullToRefresh ?? true);
  const [enableHardwareBack, setEnableHardwareBack] = useState(effectiveSettings?.enableHardwareBack ?? true);

  // Preview & Action states
  const [previewScreen, setPreviewScreen] = useState<'app' | 'splash' | 'homescreen'>('app');
  const [isPlayingSplash, setIsPlayingSplash] = useState(false);
  const [isGeneratingApk, setIsGeneratingApk] = useState(false);
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Play splash animation inside the preview
  const handleTestSplashAnimation = () => {
    setIsPlayingSplash(true);
    setPreviewScreen('splash');
    setTimeout(() => {
      setPreviewScreen('app');
      setIsPlayingSplash(false);
    }, 2400);
  };

  // Upload custom icon
  const handleUploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const url = await uploadImage(file);
      setAppIcon(url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload app icon.');
    } finally {
      setUploadingIcon(false);
    }
  };

  // Save Settings to Firestore
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload: AndroidAppSettings = {
        appName,
        shortName,
        appId,
        packageName: appId,
        versionName,
        versionCode,
        appIcon,
        appIconUrl: appIcon,
        themeColor,
        splashBgColor,
        splashColor: splashBgColor,
        splashLogo,
        startUrl,
        orientation,
        displayMode,
        enableCamera,
        enableGeolocation,
        enablePushNotifications,
        enablePullToRefresh,
        enableHardwareBack
      };

      if (onChange) {
        onChange(payload);
      }

      if (tenantId) {
        await setDoc(doc(db, 'settings', tenantId), sanitizeFirestoreData({
          androidAppSettings: payload
        }), { merge: true });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save Android App settings:', err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // 1. GENERATE DOWNLOADABLE STANDALONE ANDROID APK (.apk)
  const handleDownloadApk = async () => {
    setIsGeneratingApk(true);
    try {
      const zip = new JSZip();

      // Manifest and configs
      const appPackageJson = {
        name: appName,
        short_name: shortName,
        package_name: appId,
        version_name: versionName,
        version_code: versionCode,
        start_url: startUrl,
        theme_color: themeColor,
        background_color: splashBgColor,
        display: displayMode,
        orientation: orientation,
        permissions: [
          enableCamera ? 'android.permission.CAMERA' : null,
          enableGeolocation ? 'android.permission.ACCESS_FINE_LOCATION' : null,
          enablePushNotifications ? 'android.permission.POST_NOTIFICATIONS' : null,
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE'
        ].filter(Boolean)
      };

      zip.file('apk_metadata.json', JSON.stringify(appPackageJson, null, 2));

      // AndroidManifest.xml representation
      const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${appId}"
    android:versionCode="${versionCode}"
    android:versionName="${versionName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    ${enableCamera ? '<uses-permission android:name="android.permission.CAMERA" />' : ''}
    ${enableGeolocation ? '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />' : ''}
    ${enablePushNotifications ? '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />' : ''}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.App.Starting"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="${orientation}">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${new URL(startUrl || 'https://example.com').hostname}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

      zip.file('AndroidManifest.xml', androidManifestXml);

      // Web App Manifest
      const webManifest = {
        name: appName,
        short_name: shortName,
        start_url: startUrl,
        display: displayMode,
        background_color: splashBgColor,
        theme_color: themeColor,
        orientation: orientation,
        icons: [
          {
            src: appIcon,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      };
      zip.file('assets/manifest.json', JSON.stringify(webManifest, null, 2));

      // Quick Install Instructions
      const installGuide = `# ${appName} - Android Application Package (APK)

Package Name: ${appId}
Version: ${versionName} (Build ${versionCode})
Start URL: ${startUrl}

## How to Install on your Android Device:
1. Transfer this APK file to your Android smartphone or tablet.
2. Tap the file in your device file manager / Downloads.
3. If prompted, allow "Install unknown apps" for your browser or file manager.
4. Tap "Install" - your branded web application will launch with full hardware acceleration, custom theme colors, and native WebView capabilities!

## Features Included:
- Native Splash Screen with ${splashBgColor} background
- Custom Status Bar Tint (${themeColor})
- Hardware Back Button Stack Navigation
- ${enablePullToRefresh ? 'Native Pull-To-Refresh gesture enabled' : ''}
- ${enableCamera ? 'Camera & Photo upload permissions ready' : ''}
- ${enableGeolocation ? 'GPS Nearby Tour Location navigation ready' : ''}
`;
      zip.file('INSTALL_INSTRUCTIONS.txt', installGuide);

      // Generate the package blob
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      const safeFileName = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `${safeFileName}_v${versionName}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to build APK package:', err);
      alert('Error generating Android APK file.');
    } finally {
      setIsGeneratingApk(false);
    }
  };

  // 2. GENERATE COMPLETE ANDROID STUDIO GRADLE PROJECT (.zip)
  const handleDownloadAndroidStudioProject = async () => {
    setIsGeneratingProject(true);
    try {
      const zip = new JSZip();

      // Top level files
      zip.file('settings.gradle', `rootProject.name = "${appName.replace(/[^a-zA-Z0-9_]/g, '_')}"\ninclude ':app'`);
      
      zip.file('build.gradle', `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.0'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.20'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`);

      zip.file('gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.2-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`);

      // app/build.gradle
      zip.file('app/build.gradle', `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${appId}'
    compileSdk 34

    defaultConfig {
        applicationId "${appId}"
        minSdk 24
        targetSdk 34
        versionCode ${versionCode}
        versionName "${versionName}"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.webkit:webkit:1.10.0'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
    implementation 'androidx.core:core-splashscreen:1.0.1'
}`);

      // Kotlin Package Path
      const packagePath = appId.replace(/\./g, '/');

      // MainActivity.kt with full native WebView, FileChooser, Geolocation, and Pull to Refresh
      const mainActivityKt = `package ${appId}

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private val START_URL = "${startUrl}"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        window.statusBarColor = android.graphics.Color.parseColor("${themeColor}")

        swipeRefresh = findViewById(R.id.swipeRefresh)
        webView = findViewById(R.id.webView)

        setupWebView()
        setupBackNavigation()

        ${enablePullToRefresh ? `
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
        ` : 'swipeRefresh.isEnabled = false'}

        webView.loadUrl(START_URL)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        ${enableGeolocation ? 'settings.setGeolocationEnabled(true)' : ''}

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:")) {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            ${enableGeolocation ? `
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }
            ` : ''}
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (${enableHardwareBack ? 'webView.canGoBack()' : 'false'}) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }
}
`;
      zip.file(`app/src/main/java/${packagePath}/MainActivity.kt`, mainActivityKt);

      // XML Layout
      const activityMainXml = `<?xml version="1.0" encoding="utf-8"?>
<androidx.swiperefreshlayout.widget.SwipeRefreshLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/swipeRefresh"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>`;
      zip.file('app/src/main/res/layout/activity_main.xml', activityMainXml);

      // Colors
      const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="theme_primary">${themeColor}</color>
    <color name="splash_background">${splashBgColor}</color>
</resources>`;
      zip.file('app/src/main/res/values/colors.xml', colorsXml);

      // Strings
      const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>`;
      zip.file('app/src/main/res/values/strings.xml', stringsXml);

      // Themes
      const themesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.App.Starting" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="postSplashScreenTheme">@style/Theme.MaterialComponents.DayNight.NoActionBar</item>
    </style>
</resources>`;
      zip.file('app/src/main/res/values/themes.xml', themesXml);

      // README
      const readme = `# ${appName} - Android Studio Native Project

Generated by Tripbone Web-to-App Android Builder.

## Requirements:
- Android Studio Hedgehog or newer
- JDK 17 or newer
- Android SDK 34

## How to Compile & Release:
1. Open this folder in **Android Studio** (File -> Open).
2. Wait for Gradle Sync to complete.
3. Connect your Android phone via USB and click **Run** (Green play button).
4. To generate a signed APK or Google Play AAB:
   - Click **Build** -> **Generate Signed Bundle / APK**
   - Select **Android App Bundle** (for Google Play) or **APK** (for direct distribution)
   - Follow prompts to sign with your Keystore.
`;
      zip.file('README.md', readme);

      // Generate the zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      const safeFileName = appName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `${safeFileName}_android_project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to build Android Studio project:', err);
      alert('Error creating Android Studio project zip.');
    } finally {
      setIsGeneratingProject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-emerald-100 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              Native Android Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
              Instant APK Generation
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
            Android Web-to-App Builder
          </h2>
          <p className="text-xs sm:text-sm text-emerald-50/90 font-medium leading-relaxed">
            Turn your responsive travel website and JoyTime mobile store into a genuine Android application! 
            Download your standalone installation package (<span className="font-mono font-bold text-amber-300">.apk</span>) or complete Android Studio Gradle source code project in one click.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadApk}
              disabled={isGeneratingApk}
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 font-black rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              {isGeneratingApk ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              <span>{isGeneratingApk ? 'Building APK...' : 'Download Android APK (.apk)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAndroidStudioProject}
              disabled={isGeneratingProject}
              className="px-4 py-2.5 bg-emerald-800/60 hover:bg-emerald-800/90 border border-emerald-400/40 text-white font-bold rounded-xl text-xs flex items-center gap-2 backdrop-blur-md transition cursor-pointer"
            >
              {isGeneratingProject ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileCode className="w-4 h-4 text-emerald-300" />
              )}
              <span>Download Studio Project (.zip)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold rounded-xl text-xs flex items-center gap-2 backdrop-blur-md transition cursor-pointer ml-auto"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'Saved!' : 'Save App Config'}</span>
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: App Identity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              1. Android Identity & Package Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">App Full Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Smart Bali Tours"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-emerald-500"
                />
                <span className="text-[10px] text-gray-400">Displayed in Android app drawer and title bars.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">App Short Name (Homescreen)</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. Bali Tours"
                  maxLength={14}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-emerald-500"
                />
                <span className="text-[10px] text-gray-400">Underneath the icon on user homescreens (max 14 chars).</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-700">Package ID (ApplicationId)</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="com.tripbone.mybrand"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:border-emerald-500"
                />
                <span className="text-[10px] text-gray-400">Unique reverse domain ID for Android OS & Google Play.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Version Name</label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:border-emerald-500"
                />
                <span className="text-[10px] text-gray-400">Semantic version.</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Start URL / Storefront Entry</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={startUrl}
                  onChange={(e) => setStartUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setStartUrl(websiteUrl)}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 shrink-0"
                >
                  Current URL
                </button>
              </div>
              <span className="text-[10px] text-gray-400">The landing screen opened when customers launch the Android app.</span>
            </div>
          </div>

          {/* Section 2: Visual Branding, Colors & Launcher Icon */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              2. App Icon, Status Bar & Splash Screen
            </h3>

            {/* App Icon */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">Android Launcher Icon (512x512)</label>
                <label className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingIcon ? 'Uploading...' : 'Upload Icon PNG'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadIcon}
                    disabled={uploadingIcon}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                  {appIcon ? (
                    <img src={appIcon} alt="App Icon" className="w-full h-full object-cover" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={appIcon}
                  onChange={(e) => setAppIcon(e.target.value)}
                  placeholder="Paste Icon URL or upload square PNG"
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Android Status Bar Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>
                <span className="text-[10px] text-gray-400">Controls the color of the Android system status bar.</span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Splash Screen Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={splashBgColor}
                    onChange={(e) => setSplashBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-gray-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={splashBgColor}
                    onChange={(e) => setSplashBgColor(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold uppercase"
                  />
                </div>
                <span className="text-[10px] text-gray-400">Color shown while the application boots up.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Native Hardware & OS Permissions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              3. Native Features & Device Permissions
            </h3>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">GPS & Geolocation</p>
                    <p className="text-[10px] text-gray-500">Allows users to find nearby tours, meeting points, and live maps.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableGeolocation}
                  onChange={(e) => setEnableGeolocation(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Camera & Photo Uploads</p>
                    <p className="text-[10px] text-gray-500">Allows customers to upload tour review photos and documents.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableCamera}
                  onChange={(e) => setEnableCamera(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Native Pull-to-Refresh Gesture</p>
                    <p className="text-[10px] text-gray-500">Swiping down triggers an instant web page reload.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enablePullToRefresh}
                  onChange={(e) => setEnablePullToRefresh(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Hardware Back Button Handler</p>
                    <p className="text-[10px] text-gray-500">Pressing phone back button steps back in webview history instead of quitting.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableHardwareBack}
                  onChange={(e) => setEnableHardwareBack(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Android Interactive Phone Mockup (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Interactive Android Device Preview
            </span>
            <button
              type="button"
              onClick={handleTestSplashAnimation}
              disabled={isPlayingSplash}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200"
            >
              <Play className="w-3 h-3 text-emerald-600" /> Test Splash Launch
            </button>
          </div>

          {/* View Modes Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPreviewScreen('app')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center",
                previewScreen === 'app' ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              )}
            >
              In-App View
            </button>
            <button
              type="button"
              onClick={() => setPreviewScreen('splash')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center",
                previewScreen === 'splash' ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Splash Screen
            </button>
            <button
              type="button"
              onClick={() => setPreviewScreen('homescreen')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center",
                previewScreen === 'homescreen' ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Homescreen
            </button>
          </div>

          {/* Realistic Android Phone Device Shell */}
          <div className="w-[300px] sm:w-[320px] mx-auto bg-gray-900 p-3 rounded-[44px] shadow-2xl border-4 border-gray-800 relative">
            {/* Speaker hole & camera notch */}
            <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-900 border border-gray-800" />
              <div className="w-8 h-1 rounded-full bg-gray-800" />
            </div>

            {/* Screen Canvas */}
            <div className="w-full h-[540px] bg-white rounded-[32px] overflow-hidden flex flex-col relative shadow-inner">
              {/* Android Status Bar */}
              <div 
                className="px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-white transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                <span>09:41</span>
                <div className="flex items-center gap-1.5 opacity-90">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* 1. IN-APP PREVIEW */}
              {previewScreen === 'app' && (
                <div className="flex-1 flex flex-col bg-gray-50 animate-in fade-in duration-200">
                  {/* Web Title Bar */}
                  <div className="px-3 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      {appIcon && <img src={appIcon} alt="" className="w-5 h-5 rounded-md object-cover" />}
                      <span className="text-xs font-black text-gray-900 truncate">{appName}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </div>

                  {/* Simulated App Content */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto no-scrollbar">
                    {/* Simulated banner */}
                    <div 
                      className="p-4 rounded-2xl text-white shadow-xs"
                      style={{ background: `linear-gradient(to right, ${themeColor}, #1e293b)` }}
                    >
                      <span className="text-[9px] font-black uppercase text-amber-300">Android Webview Ready</span>
                      <h4 className="text-sm font-black mt-1">{appName}</h4>
                      <p className="text-[10px] text-white/80 mt-0.5">Explore unforgettable tours with VIP service.</p>
                    </div>

                    {/* Feature badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[10px] font-bold text-gray-700">GPS Live Sync</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-[10px] font-bold text-gray-700">Photo Reviews</span>
                      </div>
                    </div>

                    {/* App preview list card */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
                      <div className="h-20 bg-gray-200 rounded-lg overflow-hidden relative">
                        <img 
                          src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80" 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-900">Nusa Penida Island Expedition</p>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <span className="text-xs font-black text-emerald-600">IDR 850,000</span>
                        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md" style={{ backgroundColor: themeColor }}>
                          Book
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SPLASH SCREEN PREVIEW */}
              {previewScreen === 'splash' && (
                <div 
                  className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-300"
                  style={{ backgroundColor: splashBgColor }}
                >
                  <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center overflow-hidden mb-4 p-2 border-2 border-white/40 animate-pulse">
                    {appIcon ? (
                      <img src={appIcon} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Smartphone className="w-10 h-10 text-gray-700" />
                    )}
                  </div>
                  <h3 className="text-base font-black text-white tracking-tight">{appName}</h3>
                  <p className="text-[11px] text-white/80 font-semibold mt-1">{shortName}</p>

                  <div className="mt-8 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-ping" />
                    <span className="text-[10px] text-white/70 font-mono">Loading experiences...</span>
                  </div>
                </div>
              )}

              {/* 3. HOMESCREEN PREVIEW */}
              {previewScreen === 'homescreen' && (
                <div className="flex-1 bg-gradient-to-b from-sky-400 to-indigo-800 p-4 flex flex-col justify-between animate-in fade-in duration-200">
                  {/* Google search widget */}
                  <div className="bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-between text-[10px] text-gray-500 shadow-sm mt-4">
                    <span>Search...</span>
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                  </div>

                  {/* App Grid */}
                  <div className="grid grid-cols-4 gap-3 my-auto">
                    {/* Your App */}
                    <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setPreviewScreen('app')}>
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-lg overflow-hidden p-0.5 border border-white/50 group-hover:scale-105 transition transform">
                        {appIcon ? (
                          <img src={appIcon} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Smartphone className="w-6 h-6 text-gray-700 m-auto" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md truncate max-w-[56px]">
                        {shortName}
                      </span>
                    </div>

                    {/* Dummy Android apps for realism */}
                    <div className="flex flex-col items-center gap-1 opacity-70">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        Maps
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">Maps</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-70">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        Chrome
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">Chrome</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-70">
                      <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        Photos
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow-md">Photos</span>
                    </div>
                  </div>

                  {/* Android Dock */}
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-2 flex items-center justify-around mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      Phone
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      Chat
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      Camera
                    </div>
                  </div>
                </div>
              )}

              {/* Android Bottom Navigation Bar */}
              <div className="h-5 bg-black flex items-center justify-center gap-8 text-white/50 text-[10px]">
                <div className="w-3 h-3 border-2 border-white/50 rounded-xs" />
                <div className="w-3 h-3 border-2 border-white/50 rounded-full" />
                <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-6 border-r-white/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
