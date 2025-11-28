/**
 * WarningModal.tsx
 * Warning modal component for content security alerts
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import colors from './colors';

interface WarningModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const WarningModal: React.FC<WarningModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Continue',
  cancelText = 'Go Back',
}) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Image 
              source={{uri: 'https://cdn-icons-png.flaticon.com/512/594/594517.png'}} 
              style={styles.warningIcon}
            />
            <Text style={styles.title}>{title}</Text>
          </View>
          <ScrollView style={styles.content}>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.warningDetails}>
              <Text style={styles.detailTitle}>Security Information:</Text>
              <View style={styles.detailItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.detailText}>This website has been flagged for potentially inappropriate content</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.detailText}>Continuing may expose you to unsafe content</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.detailText}>We recommend returning to a safe browsing environment</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    width: Dimensions.get('window').width * 0.9,
    maxHeight: Dimensions.get('window').height * 0.7,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    backgroundColor: colors.accent,
    padding: 25,
    alignItems: 'center',
    paddingTop: 35,
  },
  warningIcon: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    maxHeight: Dimensions.get('window').height * 0.4,
  },
  message: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  warningDetails: {
    backgroundColor: colors.accentLight,
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.accent,
    marginRight: 8,
    fontWeight: 'bold',
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: colors.gray100,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray300,
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WarningModal;