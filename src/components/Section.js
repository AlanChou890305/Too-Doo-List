import React from "react";
import { View, Text } from "react-native";

const Section = ({ title, content, theme, isFirst }) => (
  <View style={{ marginTop: isFirst ? 0 : 24 }}>
    {title && (
      <Text
        style={{
          fontSize: 17,
          color: theme.text,
          fontWeight: "700",
          marginBottom: 8,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
    )}
    <Text
      style={{
        fontSize: 15,
        color: theme.text,
        lineHeight: 26,
        letterSpacing: 0.2,
      }}
    >
      {content}
    </Text>
  </View>
);

export default Section;
