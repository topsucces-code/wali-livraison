import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button } from 'react-native-paper';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour !</Text>
        <Text style={styles.subtitle}>Que souhaitez-vous faire aujourd'hui ?</Text>
      </View>

      <View style={styles.services}>
        <Card style={styles.serviceCard}>
          <Card.Content>
            <Text style={styles.serviceIcon}>🍕</Text>
            <Text style={styles.serviceTitle}>Restaurants</Text>
            <Text style={styles.serviceDescription}>
              Commandez vos plats préférés
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" style={styles.serviceButton}>
              Commander
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.serviceCard}>
          <Card.Content>
            <Text style={styles.serviceIcon}>🛒</Text>
            <Text style={styles.serviceTitle}>Courses</Text>
            <Text style={styles.serviceDescription}>
              Faites vos courses en ligne
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" style={styles.serviceButton}>
              Faire ses courses
            </Button>
          </Card.Actions>
        </Card>

        <Card style={styles.serviceCard}>
          <Card.Content>
            <Text style={styles.serviceIcon}>📦</Text>
            <Text style={styles.serviceTitle}>Colis</Text>
            <Text style={styles.serviceDescription}>
              Envoyez vos colis rapidement
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="contained" 
              style={styles.serviceButton}
              onPress={() => navigation.navigate('CreateOrder')}
            >
              Envoyer un colis
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  services: {
    padding: 20,
    gap: 15,
  },
  serviceCard: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  serviceIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  serviceDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  serviceButton: {
    backgroundColor: '#FF6B35',
  },
});
