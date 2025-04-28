import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import {Svg,  Circle } from "react-native-svg";

interface FootDiagramProps {
  foot: "left" | "right";
  selectedPoints: string[];
  onSelectPoint: (point: string) => void;
}

// (Your LeftPainPoints and RightPainPoints here)
// Create left and right foot pain points with unique IDs
const LeftPainPoints = [
    { id: "left-toes", label: "Toes", x: 180, y: 30 },
    { id: "left-midfoot1", label: "Midfoot", x: 150, y: 30 },
    { id: "left-midfoot2", label: "Midfoot", x: 130, y: 30 },
    { id: "left-midfoot3", label: "Midfoot", x: 110, y: 40 },
    { id: "left-midfoot4", label: "Midfoot", x: 90, y: 60 },
    { id: "left-midfoot5", label: "Midfoot", x: 170, y: 90 },
    { id: "left-midfoot6", label: "Midfoot", x: 120, y: 90 },
    { id: "left-ball", label: "Ball of foot", x: 110, y: 130 },
    { id: "left-midfoot7", label: "Midfoot", x: 170, y: 150 },
    { id: "left-midfoot8", label: "Midfoot", x: 110, y: 190 },
    { id: "left-ankle1", label: "Ankle", x: 160, y: 210 },
    { id: "left-arch", label: "Arch", x: 160, y: 240 },
    { id: "left-ankle2", label: "Ankle", x: 120, y: 250 },
    { id: "left-heel", label: "Heel", x: 140, y: 280 },
  ];


const RightPainPoints = [
    { id: "right-toes", label: "Toes", x: 190, y: 30 },
    { id: "right-midfoot1", label: "Midfoot", x: 160, y: 30 },
    { id: "right-midfoot2", label: "Midfoot", x: 140, y: 30 },
    { id: "right-midfoot3", label: "Midfoot", x:115, y: 40 },
    { id: "right-midfoot4", label: "Midfoot", x: 100, y: 60 },
    { id: "right-midfoot5", label: "Midfoot", x: 180, y: 90 },
    { id: "right-midfoot6", label: "Midfoot", x: 120, y: 90 },
    { id: "right-ball", label: "Ball of foot", x: 120, y: 130 },
    { id: "right-midfoot7", label: "Midfoot", x: 170, y: 150 },
    { id: "right-midfoot8", label: "Midfoot", x: 130, y: 190 },
    { id: "right-ankle1", label: "Ankle", x: 170, y: 210 },
    { id: "right-arch", label: "Arch", x: 170, y: 240 },
    { id: "right-ankle2", label: "Ankle", x: 130, y: 250 },
    { id: "right-heel", label: "Heel", x: 150, y: 280 },
  ];

const FootDiagram: React.FC<FootDiagramProps> = ({
  foot,
  selectedPoints,
  onSelectPoint,
}) => {
  const points = foot === "left" ? LeftPainPoints : RightPainPoints;

  const getAdjustedX = (x: number) => (foot === "right" ? 300 - x : x);

  return (
    <View style={styles.container}>
      <Image
        source={
          foot === "left"
            ? require("../assets/images/leftFoot.jpeg") // ✅ fixed path
            : require("../assets/images/rightFoot.jpeg")
        }
        style={styles.footImage}
        resizeMode="contain"
      />

      <Svg height="300" width="300" style={styles.svgOverlay}>
        {points.map((point) => (
          <Circle
            key={point.id}
            cx={getAdjustedX(point.x)}
            cy={point.y}
            r={8}
            fill={
              selectedPoints.includes(point.id)
                ? "#00843D"
                : "rgba(58, 56, 56, 0.5)"
            }
            onPress={() => onSelectPoint(point.id)}
          />
        ))}
      </Svg>

      <View style={styles.legendContainer}>
        {points.map((point) => (
          <TouchableOpacity
            key={point.id}
            style={styles.legendItem}
            onPress={() => onSelectPoint(point.id)}
          >
            <View
              style={[
                styles.legendDot,
                selectedPoints.includes(point.id) && styles.selectedDot,
              ]}
            />
            <Text style={styles.legendText}>{point.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // alignItems: "center",
    position: "relative",
  },
  footImage: {
    width: 300,
    height: 300,
  },
  svgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  legendContainer: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  legendItem: {
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: "2.5%",
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(102, 99, 99, 0.5)",
    marginRight: 8,
  },
  selectedDot: {
    backgroundColor: "#00843D",
  },
  legendText: {
    fontSize: 14,
    color: "#333",
  },
});

export default FootDiagram;
