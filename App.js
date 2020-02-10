/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TextInput,
  Button,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import FTP from 'react-native-ftp-client';
import RNFileSelector from 'react-native-file-selector';

const App: () => React$Node = () => {
  const [ipValue, onIpChangeText] = React.useState('192.168.76.1');
  const [listValue, onListChange] = React.useState('List of FTP');
  const [tokenValue, onTokenChange] = React.useState('');
  const [progressValue, onProgressChange] = React.useState('');
  const root_dir = '/Memory Card - 1/';
  // const root_dir = '/userdata';

  useEffect(() => {
    FTP.setup({
      ip_address: ipValue,
      port: 21,
      username: 'anonymous',
      password: 'guest',
    }); //Setup host
  });
  const listFile = async path => {
    const res = await FTP.list(path);
    const text = res
      .map(
        a =>
          'name:' +
          a.name +
          ' type:' +
          a.type +
          ' size:' +
          a.size +
          ' time:' +
          a.timestamp.toISOString(),
      )
      .join('\n');
    onListChange(text);
    return text;
  };

  const connectToIp = async () => {
    await listFile('');
  };

  const deleteFile = async () => {
    await FTP.remove(root_dir + '/demo.bak');
    await listFile(root_dir);
  };

  const uploadFile = async () => {
    RNFileSelector.Show({
      title: 'Select File',
      onDone: async filePath => {
        const path = filePath.replace('file://', '');
        console.log('file selected: ' + path);
        try {
          let currentToken = '';
          const subscription = FTP.addProgressListener(
            ({token, percentage}) => {
              if (percentage === 0) {
                onTokenChange(token);
                console.log('start uploading : ' + token);
                currentToken = token;
              }
              if (token !== currentToken) {
                onProgressChange('token:' + token + ' != ' + currentToken);
              } else {
                onProgressChange(percentage + '%');
                if (percentage >= 100) {
                  onTokenChange('');
                  listFile(root_dir);
                  subscription.remove();
                }
              }
            },
          );
          await FTP.uploadFile(path, root_dir + '/demo.bak');
        } catch (error) {
          console.log(error.message);
          onProgressChange(error.message);
          onTokenChange('');
        }
      },
      onCancel: () => {
        console.log('cancelled');
      },
    });
  };
  const cancelUpload = async () => {
    FTP.cancelUploadFile(tokenValue);
    onProgressChange('Cancelled');
    onTokenChange('');
    listFile(root_dir);
  };
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Connect to:</Text>
              <TextInput
                editable
                maxLength={40}
                numberOfLines={1}
                onChangeText={text => onIpChangeText(text)}
                value={ipValue}
              />
              <Button title="Connect" onPress={connectToIp} />
              <Text style={styles.sectionDescription}>{listValue}</Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Demo upload</Text>
              <Text style={styles.sectionDescription}>{progressValue}</Text>
              <Button title="Upload" onPress={uploadFile} />
              <Button
                title="Cancel"
                disabled={!tokenValue}
                onPress={cancelUpload}
              />
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Demo delete</Text>
              <Button title="Delete" onPress={deleteFile} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
