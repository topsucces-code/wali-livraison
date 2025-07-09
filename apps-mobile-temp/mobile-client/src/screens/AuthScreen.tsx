import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';

interface AuthScreenProps {
  navigation: any;
}

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = async () => {
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    setLoading(true);
    // TODO: Intégrer avec l'API d'authentification
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleOtpSubmit = async () => {
    if (otp !== '123456') {
      Alert.alert('Erreur', 'Code de vérification invalide');
      return;
    }

    setLoading(true);
    // TODO: Intégrer avec l'API d'authentification
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main');
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WALI Livraison</Text>
      
      {step === 'phone' ? (
        <>
          <Text style={styles.subtitle}>Entrez votre numéro de téléphone</Text>
          <TextInput
            label="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
            placeholder="+225 07 01 23 45 67"
          />
          <Button 
            mode="contained" 
            onPress={handlePhoneSubmit}
            loading={loading}
            style={styles.button}
          >
            Continuer
          </Button>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Code de vérification</Text>
          <Text style={styles.info}>
            Un code a été envoyé au {phone}
          </Text>
          <TextInput
            label="Code de vérification"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            style={styles.input}
            placeholder="123456"
          />
          <Button 
            mode="contained" 
            onPress={handleOtpSubmit}
            loading={loading}
            style={styles.button}
          >
            Vérifier
          </Button>
          <Text style={styles.devNote}>
            Mode développement : utilisez 123456
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#FF6B35',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#FF6B35',
  },
  devNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontStyle: 'italic',
  },
});
