# Add project specific ProGuard rules here.
# Keep Room generated code.
-keep class * extends androidx.room.RoomDatabase { *; }
-keepclassmembers class * { @androidx.room.* <methods>; }
