/**
 * UserInfoModal.tsx
 * User information collection modal for the Content Security Monitor app
 */

import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import colors from './colors';

interface UserInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (userInfo: UserInfo) => void;
}

interface UserInfo {
  gender: string;
  age: string;
  education: string;
  occupation: string;
  browsingFrequency: string;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [browsingFrequency, setBrowsingFrequency] = useState('');

  const handleSave = () => {
    if (!gender || !age || !education || !occupation || !browsingFrequency) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return;
    }

    const userInfo: UserInfo = {
      gender,
      age,
      education,
      occupation,
      browsingFrequency,
    };

    onSave(userInfo);
  };

  const genderOptions = [
    {label: 'Male', value: 'male'},
    {label: 'Female', value: 'female'},
    {label: 'Other', value: 'other'},
    {label: 'Prefer not to say', value: 'prefer_not_to_say'},
  ];

  const educationOptions = [
    {label: 'Elementary School', value: 'elementary'},
    {label: 'Middle School', value: 'middle'},
    {label: 'High School', value: 'high'},
    {label: 'College/University', value: 'college'},
    {label: 'Graduate School', value: 'graduate'},
    {label: 'Other', value: 'other'},
  ];

  const frequencyOptions = [
    {label: 'Never', value: 'never'},
    {label: 'Rarely (Less than once a month)', value: 'rarely'},
    {label: 'Occasionally (1-3 times per month)', value: 'occasionally'},
    {label: 'Frequently (Once a week)', value: 'frequently'},
    {label: 'Very Frequently (Several times a week)', value: 'very_frequently'},
    {label: 'Daily', value: 'daily'},
  ];

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>User Information</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.description}>
              Please provide some information to help us better understand your browsing habits and provide personalized content security.
            </Text>

            {/* Gender */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={gender}
                  onValueChange={setGender}
                  style={styles.picker}>
                  <Picker.Item label="Select Gender" value="" />
                  {genderOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Age */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Education */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Education Level *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={education}
                  onValueChange={setEducation}
                  style={styles.picker}>
                  <Picker.Item label="Select Education Level" value="" />
                  {educationOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Occupation */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Occupation *</Text>
              <TextInput
                style={styles.input}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="Enter your occupation"
              />
            </View>

            {/* Browsing Frequency */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                How often do you encounter inappropriate content? *
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={browsingFrequency}
                  onValueChange={setBrowsingFrequency}
                  style={styles.picker}>
                  <Picker.Item label="Select Frequency" value="" />
                  {frequencyOptions.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Information</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: Dimensions.get('window').height * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.0,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 25,
    lineHeight: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray400,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray400,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray300,
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UserInfoModal;