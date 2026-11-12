import { SafeAreaProvider } from "react-native-safe-area-context";
import StudentRegistrationScreen from "./src/screens/StudentRegistrationScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <StudentRegistrationScreen />
    </SafeAreaProvider>
  );
}