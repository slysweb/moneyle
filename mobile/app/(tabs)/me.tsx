import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/ui";
import { type } from "../../src/theme";

export default function MeScreen() {
  return (
    <Screen>
      <View style={styles.wrap}>
        <Text style={styles.kicker}>ME</Text>
        <Text style={styles.title}>Me</Text>
        <Text style={styles.copy}>
          Personal stats will live here once they exist on the website. Today’s games and the
          archive already work without this page.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 20, gap: 10 },
  kicker: { ...type.kicker, textTransform: "uppercase" },
  title: { ...type.title, fontSize: 34 },
  copy: { ...type.body, color: "#6a706c", marginTop: 6 },
});
