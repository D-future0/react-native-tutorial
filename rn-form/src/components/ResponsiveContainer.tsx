import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

type ResponsiveContainerProps = {
  children: ReactNode;
  maxWidth?: number;
};

export default function ResponsiveContainer({
  children,
  maxWidth = 1200,
}: ResponsiveContainerProps) {
  return (
    <View style={[styles.container, { maxWidth }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    columnGap: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
});
