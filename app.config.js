import 'dotenv/config';

export default {
  name: "Papa Tango",
  slug: "papamotos",
  version: "1.0.0",
  scheme: "papamotors",
  orientation: "portrait",
  updates: {
    url: "https://u.expo.dev/2d93efbd-1062-4051-bf44-18c916565fb7"
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#CB2921"
  },
  plugins: [
    [
      "expo-document-picker",
      {
        "iCloudContainerEnvironment": "Production"
      }
    ],
    [
      "expo-image-picker",
      {
        "photosPermission": "O aplicativo precisa acessar suas fotos para permitir o upload de imagens.",
        "cameraPermission": "O aplicativo precisa acessar sua câmera para tirar fotos."
      }
    ],
    [
      "expo-file-system",
      {
      }
    ],
    [
      "expo-video",
      {
        "supportsBackgroundPlayback": true,
        "supportsPictureInPicture": true
      }
    ],
    [
      "expo-splash-screen",
      {
        "backgroundColor": "#CB2921",
        "imageResizeMode": "contain",
        "image": "./assets/splash-icon.png"
      }
    ],
    "expo-notifications",
  ],
  notification: {
    icon: "./assets/notification-icon.png",
    color: "#CB2921",
    androidMode: "default",
    androidCollapsedTitle: "Papa Tango",
    iosDisplayInForeground: true
  },
  ios: {
    infoPlist: {
      NSCameraUsageDescription: "Este aplicativo precisa de acesso à câmera.",
      NSPhotoLibraryUsageDescription: "Este aplicativo precisa de acesso à galeria.",
      NSPhotoLibraryAddUsageDescription: "Este aplicativo precisa de permissão para salvar fotos na sua galeria",
      UIBackgroundModes: ["remote-notification"],
      NSUserTrackingUsageDescription: "Este identificador será usado para entregar notificações personalizadas para você.",
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["papamotors"],
        },
      ],
    },
    supportsTablet: true,
    bundleIdentifier: "com.app.papa.motos",
    googleServicesFile: "./GoogleService-Info.plist",
    buildNumber: "1",
    config: {
      usesNonExemptEncryption: false
    },
    associatedDomains: [
      "applinks:papatangoalugueldemotos.com.br",
      "applinks:www.papatangoalugueldemotos.com.br"
    ],
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#CB2921"
    },
    useNextNotificationsApi: true,
    newArchEnabled: true,
    package: "com.papatango.alugueldemotos",
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "INTERNET",
      "VIBRATE"
    ],
    googleServicesFile: "./google-services.json",
    softwareKeyboardLayoutMode: "pan",
    navigationBarColor: "#CB2921",
    splash: {
      backgroundColor: "#CB2921",
      mdpi: "./assets/splash-icon.png",
      hdpi: "./assets/splash-icon.png",
      xhdpi: "./assets/splash-icon.png",
      xxhdpi: "./assets/splash-icon.png",
      xxxhdpi: "./assets/splash-icon.png"
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: "https",
            host: "papatangoalugueldemotos.com.br",
            pathPrefix: "/"
          },
          {
            scheme: "https",
            host: "www.papatangoalugueldemotos.com.br",
            pathPrefix: "/"
          },
          {
            scheme: "papamotors",
          }
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    icons: [
      {
        src: "./assets/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png"
      },
      {
        src: "./assets/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "./assets/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "./assets/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "./assets/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    shortcut: {
      name: "Papa Tango"
    },
    themeColor: "#CB2921",
    description: "Papa Tango Aluguel de Motos",
    lang: "pt-BR",
    scope: "/",
    startUrl: "/",
    barStyle: "default",
    backgroundColor: "#CB2921",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#CB2921"
    }
  },
  extra: {
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
    eas: {
      projectId: "2d93efbd-1062-4051-bf44-18c916565fb7"
    }
  }
};
