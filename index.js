import "react-native-gesture-handler";
// index.js for Expo entry point
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);

// Register widget task for Expo Widget
// import './widget'; // Widget temporarily disabled for SDK 52 compatibility
