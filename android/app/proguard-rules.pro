# ProGuard / R8 Hardening Rules for NetPulse

# Keep Capacitor Native Bridge and WebKit classes intact
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}

# Keep Cordova plugin bridges if any
-keep class org.apache.cordova.** { *; }
-keep interface org.apache.cordova.** { *; }

# Strip sensitive logging statements from release builds to prevent info leakage
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# General Code Obfuscation
-repackageclasses ''
-allowaccessmodification
