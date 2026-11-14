import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

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
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: "100%",
  },
});
