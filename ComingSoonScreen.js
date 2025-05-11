import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Rect, Path, Ellipse } from 'react-native-svg';

export default function ComingSoonScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 36, left: 16, flexDirection: 'row', alignItems: 'center', padding: 8 }}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={28} color="#6c63ff" />
        <Text style={{ color: '#6c63ff', fontSize: 18, marginLeft: 4 }}>Back</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Hourglass Illustration (same as PrivacyScreen) */}
        <Svg width={56} height={56} style={{ marginBottom: 12 }}>
          <Rect x={18} y={10} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Rect x={18} y={42} width={20} height={4} rx={2} fill="#E0E0E0" />
          <Path d="M20 14 Q28 28 20 42" stroke="#B0B0B0" strokeWidth={2} fill="none" />
          <Path d="M36 14 Q28 28 36 42" stroke="#B0B0B0" strokeWidth={2} fill="none" />
          <Ellipse cx={28} cy={28} rx={5} ry={3} fill="#FFD580" />
          <Rect x={26} y={28} width={4} height={10} rx={2} fill="#FFD580" />
        </Svg>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#6c63ff', marginBottom: 16 }}>Coming Soon...</Text>
        <Text style={{ fontSize: 16, color: '#555', textAlign: 'center', maxWidth: 260 }}>
          This feature will be available in a future update. Stay tuned!
        </Text>
      </View>
    </SafeAreaView>
  );
}
