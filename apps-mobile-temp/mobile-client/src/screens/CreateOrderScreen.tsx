import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';

interface CreateOrderScreenProps {
  navigation: any;
}

export default function CreateOrderScreen({ navigation }: CreateOrderScreenProps) {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    if (!pickup.trim() || !delivery.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    // TODO: Intégrer avec l'API de commandes
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Commande créée',
        'Votre commande a été créée avec succès !',
        [
          {
            text: 'Suivre',
            onPress: () => navigation.navigate('Tracking', { orderId: '12345' })
          }
        ]
      );
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Nouvelle Commande</Text>
          
          <TextInput
            label="Adresse de récupération *"
            value={pickup}
            onChangeText={setPickup}
            style={styles.input}
            placeholder="Où récupérer le colis ?"
          />

          <TextInput
            label="Adresse de livraison *"
            value={delivery}
            onChangeText={setDelivery}
            style={styles.input}
            placeholder="Où livrer le colis ?"
          />

          <TextInput
            label="Description du colis"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            placeholder="Décrivez le contenu du colis"
            multiline
            numberOfLines={3}
          />

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix estimé :</Text>
            <Text style={styles.price}>2 500 FCFA</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleCreateOrder}
            loading={loading}
            style={styles.button}
          >
            Créer la commande
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
  card: {
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#FF6B35',
  },
});
