import { View, Text } from "react-native";

export default function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={{ padding: 16, backgroundColor: "#f0f0f0" }}>
      <Text style={{ fontSize: 24 }}>{title}</Text>
    </View>
  );
}