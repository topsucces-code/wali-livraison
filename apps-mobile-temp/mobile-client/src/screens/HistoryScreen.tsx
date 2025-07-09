import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Chip } from 'react-native-paper';

interface HistoryScreenProps {
  navigation: any;
}

const mockOrders = [
  {
    id: '12345',
    date: '2024-01-15',
    pickup: 'Cocody, Angré',
    delivery: 'Yopougon, Niangon',
    status: 'delivered',
    price: '2500 FCFA',
  },
  {
    id: '12344',
    date: '2024-01-14',
    pickup: 'Plateau, Centre-ville',
    delivery: 'Marcory, Zone 4',
    status: 'cancelled',
    price: '3000 FCFA',
  },
  {
    id: '12343',
    date: '2024-01-13',
    pickup: 'Adjamé, Marché',
    delivery: 'Treichville, Rue 12',
    status: 'delivered',
    price: '2000 FCFA',
  },
];

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      case 'in_progress':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Livré';
      case 'cancelled':
        return 'Annulé';
      case 'in_progress':
        return 'En cours';
      default:
        return 'Inconnu';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique des Commandes</Text>
      </View>

      <View style={styles.ordersList}>
        {mockOrders.map((order) => (
          <TouchableOpacity
            key={order.id}
            onPress={() => navigation.navigate('Tracking', { orderId: order.id })}
          >
            <Card style={styles.orderCard}>
              <Card.Content>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <Chip 
                    style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                    textStyle={styles.statusText}
                  >
                    {getStatusLabel(order.status)}
                  </Chip>
                </View>

                <Text style={styles.orderDate}>{order.date}</Text>

                <View style={styles.addressContainer}>
                  <View style={styles.addressRow}>
                    <Text style={styles.addressLabel}>📍 Récupération :</Text>
                    <Text style={styles.addressText}>{order.pickup}</Text>
                  </View>
                  <View style={styles.addressRow}>
                    <Text style={styles.addressLabel}>🎯 Livraison :</Text>
                    <Text style={styles.addressText}>{order.delivery}</Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{order.price}</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {mockOrders.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Aucune commande</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore passé de commande
          </Text>
        </View>
      )}
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
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  ordersList: {
    padding: 20,
  },
  orderCard: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  addressContainer: {
    marginBottom: 15,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
