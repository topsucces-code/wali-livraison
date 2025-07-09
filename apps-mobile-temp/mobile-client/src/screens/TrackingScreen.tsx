import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, ProgressBar } from 'react-native-paper';

interface TrackingScreenProps {
  navigation: any;
  route: {
    params: {
      orderId: string;
    };
  };
}

export default function TrackingScreen({ navigation, route }: TrackingScreenProps) {
  const { orderId } = route.params;

  const trackingSteps = [
    { label: 'Commande créée', completed: true, time: '14:30' },
    { label: 'Livreur assigné', completed: true, time: '14:45' },
    { label: 'Colis récupéré', completed: true, time: '15:20' },
    { label: 'En cours de livraison', completed: false, time: '' },
    { label: 'Livré', completed: false, time: '' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Suivi de Commande</Text>
          <Text style={styles.orderId}>#{orderId}</Text>

          <View style={styles.progressContainer}>
            <ProgressBar progress={0.6} color="#FF6B35" style={styles.progressBar} />
            <Text style={styles.progressText}>60% terminé</Text>
          </View>

          <View style={styles.trackingContainer}>
            {trackingSteps.map((step, index) => (
              <View key={index} style={styles.trackingStep}>
                <View style={[
                  styles.stepIndicator,
                  step.completed && styles.stepCompleted
                ]}>
                  <Text style={[
                    styles.stepNumber,
                    step.completed && styles.stepNumberCompleted
                  ]}>
                    {step.completed ? '✓' : index + 1}
                  </Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepLabel,
                    step.completed && styles.stepLabelCompleted
                  ]}>
                    {step.label}
                  </Text>
                  {step.time && (
                    <Text style={styles.stepTime}>{step.time}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          <Card style={styles.driverCard}>
            <Card.Content>
              <Text style={styles.driverTitle}>Votre Livreur</Text>
              <Text style={styles.driverName}>Kouassi Jean</Text>
              <Text style={styles.driverPhone}>+225 07 12 34 56 78</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="outlined" style={styles.callButton}>
                Appeler
              </Button>
            </Card.Actions>
          </Card>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  orderId: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  trackingContainer: {
    marginBottom: 20,
  },
  trackingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepCompleted: {
    backgroundColor: '#FF6B35',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stepNumberCompleted: {
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    color: '#666',
  },
  stepLabelCompleted: {
    color: '#333',
    fontWeight: 'bold',
  },
  stepTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  driverCard: {
    backgroundColor: '#F8F8F8',
    marginTop: 20,
  },
  driverTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  driverPhone: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    borderColor: '#FF6B35',
  },
});
