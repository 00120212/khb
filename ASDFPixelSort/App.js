import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const DOT_MATRIX = {
  '0': [
    '11111',
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '11111',
  ],
  '1': [
    '00100',
    '01100',
    '00100',
    '00100',
    '00100',
    '00100',
    '01110',
  ],
  '2': [
    '11111',
    '00001',
    '00001',
    '11111',
    '10000',
    '10000',
    '11111',
  ],
  '3': [
    '11111',
    '00001',
    '00001',
    '11111',
    '00001',
    '00001',
    '11111',
  ],
  '4': [
    '10001',
    '10001',
    '10001',
    '11111',
    '00001',
    '00001',
    '00001',
  ],
  '5': [
    '11111',
    '10000',
    '10000',
    '11111',
    '00001',
    '00001',
    '11111',
  ],
  '6': [
    '11111',
    '10000',
    '10000',
    '11111',
    '10001',
    '10001',
    '11111',
  ],
  '7': [
    '11111',
    '00001',
    '00010',
    '00100',
    '01000',
    '01000',
    '01000',
  ],
  '8': [
    '11111',
    '10001',
    '10001',
    '11111',
    '10001',
    '10001',
    '11111',
  ],
  '9': [
    '11111',
    '10001',
    '10001',
    '11111',
    '00001',
    '00001',
    '11111',
  ],
  ':': [
    '0',
    '1',
    '0',
    '0',
    '1',
    '0',
    '0',
  ],
  '.': [
    '0',
    '0',
    '0',
    '0',
    '0',
    '1',
    '0',
  ],
  ' ': [
    '00000',
    '00000',
    '00000',
    '00000',
    '00000',
    '00000',
    '00000',
  ],
};

const CHAR_COLUMNS = {
  '0': 5,
  '1': 5,
  '2': 5,
  '3': 5,
  '4': 5,
  '5': 5,
  '6': 5,
  '7': 5,
  '8': 5,
  '9': 5,
  ':': 1,
  '.': 1,
  ' ': 5,
};

const DOT_GAP = 2;
const CHAR_GAP = 6;
const PANEL_HORIZONTAL = 20;
const PANEL_PADDING = 18;

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const getDotSize = (text, availableWidth, dotGap, charGap) => {
  const characters = text.split('');
  const totalColumns = characters.reduce(
    (sum, char) => sum + (CHAR_COLUMNS[char] || 5),
    0
  );
  const totalDotGaps = characters.reduce((sum, char) => {
    const columns = CHAR_COLUMNS[char] || 5;
    return sum + (columns - 1) * dotGap;
  }, 0);
  const totalCharGaps = Math.max(0, characters.length - 1) * charGap;
  const rawSize =
    (availableWidth - totalDotGaps - totalCharGaps) / Math.max(1, totalColumns);
  return Math.max(4, Math.floor(rawSize));
};

const getTimeParts = (date, is24h) => {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  let hours = hours24;
  let period = '';

  if (!is24h) {
    period = hours24 >= 12 ? 'PM' : 'AM';
    hours = hours24 % 12;
    hours = hours === 0 ? 12 : hours;
  }

  return { hours, minutes, seconds, period };
};

const formatDate = (date) => {
  const day = DAYS[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${day}, ${dd}.${mm}.${yyyy}`;
};

const DotMatrixText = ({
  text,
  dotSize,
  dotGap,
  charGap,
  color,
  inactiveColor,
  dimmedChars = '',
}) => {
  const characters = text.split('');

  return (
    <View style={styles.matrixRow}>
      {characters.map((char, index) => {
        const matrix = DOT_MATRIX[char] || DOT_MATRIX[' '];
        const isDimmed = dimmedChars.includes(char);

        return (
          <View
            key={`${char}-${index}`}
            style={[
              styles.matrixChar,
              { marginRight: index === characters.length - 1 ? 0 : charGap },
            ]}
          >
            {matrix.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={{
                  flexDirection: 'row',
                  marginBottom: rowIndex === matrix.length - 1 ? 0 : dotGap,
                }}
              >
                {row.split('').map((cell, colIndex) => {
                  const isOn = cell === '1' && !isDimmed;
                  return (
                    <View
                      key={`${rowIndex}-${colIndex}`}
                      style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        backgroundColor: isOn ? color : inactiveColor,
                        marginRight: colIndex === row.length - 1 ? 0 : dotGap,
                        opacity: isOn ? 1 : 0.25,
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};

const ToggleChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
  >
    <View style={[styles.chipDot, active && styles.chipDotActive]} />
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function App() {
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(new Date());
  const [colonOn, setColonOn] = useState(true);
  const [is24h, setIs24h] = useState(true);
  const [showSeconds, setShowSeconds] = useState(true);
  const [blinkColon, setBlinkColon] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      setColonOn((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { hours, minutes, seconds, period } = useMemo(
    () => getTimeParts(now, is24h),
    [now, is24h]
  );
  const hourText = is24h
    ? String(hours).padStart(2, '0')
    : String(hours).padStart(2, ' ');
  const minuteText = String(minutes).padStart(2, '0');
  const secondText = String(seconds).padStart(2, '0');
  const timeText = showSeconds
    ? `${hourText}:${minuteText}:${secondText}`
    : `${hourText}:${minuteText}`;

  const dateText = useMemo(() => formatDate(now), [now]);
  const availableWidth = Math.max(
    160,
    width - PANEL_HORIZONTAL * 2 - PANEL_PADDING * 2
  );
  const dotSize = useMemo(
    () => getDotSize(timeText, availableWidth, DOT_GAP, CHAR_GAP),
    [timeText, availableWidth]
  );
  const dimmedChars = blinkColon && !colonOn ? ':' : '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>NOTHING OS CLOCK</Text>
        </View>
        <Text style={styles.subtitle}>Sofort bereit</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelTopRow}>
          <Text style={styles.panelLabel}>DOT MATRIX</Text>
          <View
            style={[
              styles.secondsDot,
              colonOn ? styles.secondsDotOn : styles.secondsDotOff,
            ]}
          />
        </View>

        <View style={styles.timeRow}>
          <DotMatrixText
            text={timeText}
            dotSize={dotSize}
            dotGap={DOT_GAP}
            charGap={CHAR_GAP}
            color="#f5f5f5"
            inactiveColor="#1a1a1a"
            dimmedChars={dimmedChars}
          />
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{dateText}</Text>
          {!is24h && <Text style={styles.periodText}>{period}</Text>}
        </View>
      </View>

      <View style={styles.controls}>
        <ToggleChip
          label="24H"
          active={is24h}
          onPress={() => setIs24h((prev) => !prev)}
        />
        <ToggleChip
          label="SEK"
          active={showSeconds}
          onPress={() => setShowSeconds((prev) => !prev)}
        />
        <ToggleChip
          label="BLINK"
          active={blinkColon}
          onPress={() => setBlinkColon((prev) => !prev)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    marginRight: 8,
  },
  brandText: {
    color: '#f5f5f5',
    fontSize: 12,
    letterSpacing: 2,
  },
  subtitle: {
    color: '#7c7c7c',
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 6,
  },
  panel: {
    marginTop: 24,
    marginHorizontal: PANEL_HORIZONTAL,
    padding: PANEL_PADDING,
    backgroundColor: '#0d0d0d',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  panelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  panelLabel: {
    color: '#8c8c8c',
    fontSize: 11,
    letterSpacing: 2,
  },
  secondsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  secondsDotOn: {
    backgroundColor: '#ff3b30',
  },
  secondsDotOff: {
    backgroundColor: 'transparent',
  },
  timeRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  dateText: {
    color: '#9a9a9a',
    fontSize: 14,
    letterSpacing: 1,
  },
  periodText: {
    color: '#f5f5f5',
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 4,
  },
  controls: {
    marginTop: 24,
    marginHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#0d0d0d',
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: {
    borderColor: '#f5f5f5',
    backgroundColor: '#121212',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2b2b2b',
    marginRight: 8,
  },
  chipDotActive: {
    backgroundColor: '#f5f5f5',
  },
  chipText: {
    color: '#8c8c8c',
    fontSize: 12,
    letterSpacing: 1,
  },
  chipTextActive: {
    color: '#f5f5f5',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matrixChar: {
    alignItems: 'flex-start',
  },
});
