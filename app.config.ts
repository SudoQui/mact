import type { ExpoConfig } from "expo/config";

const variant = process.env.APP_VARIANT ?? "development";

const isDev = variant === "development";
const isPreview = variant === "preview";

const name = isDev ? "MACT Dev" : isPreview ? "MACT Beta" : "MACT";

const scheme = isDev ? "mact-dev" : isPreview ? "mact-beta" : "mact";

const androidPackage = isDev
  ? "com.sudoqui.mact.dev"
  : isPreview
    ? "com.sudoqui.mact.beta"
    : "com.sudoqui.mact";

const iosBundleIdentifier = isDev
  ? "com.sudoqui.mact.dev"
  : isPreview
    ? "com.sudoqui.mact.beta"
    : "com.sudoqui.mact";

const config: ExpoConfig = {
  name,
  slug: "MACT",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme,
  userInterfaceStyle: "automatic",

  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: iosBundleIdentifier
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png"
    },
    predictiveBackGestureEnabled: false,
    package: androidPackage
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png"
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#208AEF",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 76
        }
      }
    ],
    "expo-sqlite",
    "@maplibre/maplibre-react-native",
    "expo-image"
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true
  },

  extra: {
    router: {},
    appVariant: variant,
    eas: {
      projectId: "25a5eca0-32dc-49e9-89dd-24ade508cb37"
    }
  },

  runtimeVersion: {
    policy: "appVersion"
  },

  updates: {
    url: "https://u.expo.dev/25a5eca0-32dc-49e9-89dd-24ade508cb37"
  }
};

export default config;