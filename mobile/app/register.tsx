import { useEffect } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { GameHeader, Screen } from "../src/ui";
import { useAuth } from "../src/lib/auth";
import { formatJoinedOn } from "../src/lib/dates";
import { colors, radius, type } from "../src/theme";

function safeNext(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) return null;
  return value.slice(0, 200);
}

function GoogleMark() {
  return (
    <View style={styles.googleMark}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const { user, loading, error, signIn, logout } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const next = safeNext(params.next);

  useEffect(() => {
    if (user && next) router.replace(next);
  }, [user, next, router]);

  return (
    <Screen>
      <GameHeader title="Register" />
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.copy}>Checking your session…</Text>
        ) : user ? (
          <>
            <View style={styles.profile}>
              {user.pictureUrl ? (
                <Image source={{ uri: user.pictureUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>
                    {(user.name.split(/\s+/)[0] || user.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileCopy}>
                <Text style={styles.name}>{user.name}</Text>
                {formatJoinedOn(user.joinedAt) ? (
                  <Text style={styles.email}>{formatJoinedOn(user.joinedAt)}</Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.copy}>
              You’re signed in. Today’s games still work the same. The archive is unlocked.
            </Text>
            <Link href="/archive" asChild>
              <Pressable style={({ pressed }) => [styles.google, pressed && styles.pressed]}>
                <Text style={styles.googleText}>Open archive</Text>
              </Pressable>
            </Link>
            <Pressable onPress={() => void logout()} style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
              <Text style={styles.ghostText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.copy}>
              Sign in with Google to create a MoneyGames account. First time here? That creates
              it. Already registered? Same button signs you back in.
            </Text>
            <Text style={styles.dim}>
              Today’s games work without an account. Registering unlocks the archive of every
              past daily puzzle and syncs your progress across devices.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={() => void signIn()}
              style={({ pressed }) => [styles.google, pressed && styles.pressed]}
            >
              <GoogleMark />
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>
            <Text style={styles.legal}>
              By continuing you agree to the{" "}
              <Text style={styles.link} onPress={() => void Linking.openURL("https://moneygames.cc/terms")}>
                Terms
              </Text>{" "}
              and{" "}
              <Text style={styles.link} onPress={() => void Linking.openURL("https://moneygames.cc/privacy")}>
                Privacy Policy
              </Text>
              .
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 16, paddingBottom: 40, gap: 12 },
  copy: { ...type.body, color: colors.dim },
  dim: { ...type.caption, fontSize: 14, lineHeight: 20 },
  error: { ...type.caption, color: colors.red, fontSize: 14 },
  profile: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accentSoft, flexShrink: 0 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 20, fontWeight: "700", color: colors.accent },
  profileCopy: { flex: 1, minWidth: 0, gap: 3 },
  name: { ...type.heading, fontSize: 18 },
  email: { ...type.caption },
  google: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  googleG: { fontSize: 16, fontWeight: "700", color: "#4285F4" },
  googleText: { fontSize: 16, fontWeight: "600", color: colors.ink },
  ghost: {
    marginTop: 8,
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ghostText: { fontSize: 16, fontWeight: "600", color: colors.text },
  pressed: { opacity: 0.86 },
  legal: { ...type.caption, marginTop: 8, lineHeight: 20 },
  link: { color: colors.accent, fontWeight: "600" },
});
