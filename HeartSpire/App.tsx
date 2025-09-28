/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  Image,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [uri, setUri] = useState<string | undefined>();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const pickImage = async () => {
    const res = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1});
    const asset = res.assets?.[0];
    if (asset?.uri) setUri(asset.uri);
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View style={{backgroundColor: isDarkMode ? Colors.black : Colors.white}}>
          <Section title="Smart Prenatal Vitamin Finder">
            Upload a label image to preview parsing and scoring.
          </Section>
          <View style={{paddingHorizontal: 24}}>
            <Button title="Choose Label Photo" onPress={pickImage} />
            {uri ? (
              <Image
                source={{uri}}
                style={{width: '100%', height: 240, marginTop: 16, borderRadius: 8}}
                resizeMode="contain"
              />
            ) : null}
            <View style={{marginTop: 24}}>
              <Text style={{fontSize: 16, fontWeight: '600'}}>Predicted absorption</Text>
              <Text style={{marginTop: 4}}>Iron: —%   |   Folate: —%</Text>
            </View>
            <View style={{marginTop: 16}}>
              <Text style={{fontSize: 16, fontWeight: '600'}}>Cost per bioavailable mg</Text>
              <Text style={{marginTop: 4}}>$—.— / mg</Text>
            </View>
            <View style={{marginTop: 16, marginBottom: 32}}>
              <Text style={{fontSize: 16, fontWeight: '600'}}>GI Tolerance score</Text>
              <Text style={{marginTop: 4}}>—/10</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
