import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, TextInput, Avatar } from 'react-native-paper';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('Kouassi');
  const [lastName, setLastName] = useState('Yao');
  const [email, setEmail] = useState('kouassi.yao@example.com');
  const [phone, setPhone] = useState('+225 07 01 23 45 67');

  const handleSave = () => {
    // TODO: Intégrer avec l'API utilisateur
    setEditing(false);
    Alert.alert('Succès', 'Profil mis à jour avec succès !');
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => navigation.navigate('Auth')
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={`${firstName[0]}${lastName[0]}`}
            style={styles.avatar}
          />
          <Text style={styles.name}>{firstName} {lastName}</Text>
          <Text style={styles.phone}>{phone}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations Personnelles</Text>
            <Button 
              mode="text" 
              onPress={() => setEditing(!editing)}
              style={styles.editButton}
            >
              {editing ? 'Annuler' : 'Modifier'}
            </Button>
          </View>

          <TextInput
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            disabled={!editing}
            style={styles.input}
          />

          <TextInput
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            disabled={!editing}
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            disabled={!editing}
            style={styles.input}
            keyboardType="email-address"
          />

          <TextInput
            label="Téléphone"
            value={phone}
            onChangeText={setPhone}
            disabled={!editing}
            style={styles.input}
            keyboardType="phone-pad"
          />

          {editing && (
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
            >
              Sauvegarder
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>28,500</Text>
              <Text style={styles.statLabel}>FCFA dépensés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
          >
            Mes Adresses
          </Button>

          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
          >
            Paramètres de Notification
          </Button>

          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
          >
            Aide et Support
          </Button>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            buttonColor="#F44336"
          >
            Déconnexion
          </Button>
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
  profileCard: {
    backgroundColor: 'white',
    marginBottom: 15,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: '#FF6B35',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    backgroundColor: 'white',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    margin: 0,
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#FF6B35',
  },
  statsCard: {
    backgroundColor: 'white',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionsCard: {
    backgroundColor: 'white',
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 10,
  },
});
