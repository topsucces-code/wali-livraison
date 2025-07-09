# 🤝 Guide de Contribution - WALI Livraison

Merci de votre intérêt pour contribuer à WALI Livraison ! Ce guide vous aidera à démarrer.

## 🚀 **Comment Contribuer**

### **1. Fork et Clone**

```bash
# Fork le repository sur GitHub
# Puis clone votre fork
git clone https://github.com/votre-username/wali-livraison.git
cd wali-livraison

# Ajouter le repository original comme remote
git remote add upstream https://github.com/topsucces-code/wali-livraison.git
```

### **2. Configuration de l'Environnement**

```bash
# Installer les dépendances
npm install

# Copier les fichiers d'environnement
cp apps/client-web/.env.example apps/client-web/.env.local
cp apps/backend/.env.example apps/backend/.env

# Configurer vos clés API (voir README.md)
```

### **3. Créer une Branche Feature**

```bash
# Créer une nouvelle branche pour votre feature
git checkout -b feature/nom-de-votre-feature

# Ou pour un bugfix
git checkout -b fix/description-du-bug
```

## 📋 **Types de Contributions**

### **🐛 Corrections de Bugs**
- Recherchez d'abord dans les issues existantes
- Créez une issue si elle n'existe pas
- Décrivez le problème et la solution proposée

### **✨ Nouvelles Fonctionnalités**
- Discutez d'abord dans une issue
- Assurez-vous que la feature s'aligne avec la vision du projet
- Documentez la nouvelle fonctionnalité

### **📚 Documentation**
- Améliorations du README
- Documentation technique
- Guides d'utilisation
- Commentaires de code

### **🧪 Tests**
- Tests unitaires
- Tests d'intégration
- Tests end-to-end
- Amélioration de la couverture

## 🛠️ **Standards de Développement**

### **Code Style**
- Utilisez TypeScript pour tout nouveau code
- Suivez les conventions ESLint configurées
- Utilisez Prettier pour le formatage
- Nommage en français pour les variables métier

### **Commits**
Utilisez les conventions de commit :

```bash
# Format
type(scope): description

# Exemples
feat(payments): ajouter support Paystack
fix(maps): corriger géocodage Abidjan
docs(readme): mettre à jour installation
test(orders): ajouter tests création commande
```

**Types de commits :**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, point-virgules manquants, etc.
- `refactor`: Refactoring de code
- `test`: Ajout ou modification de tests
- `chore`: Maintenance, dépendances, etc.

### **Tests**
```bash
# Lancer tous les tests
npm run test

# Tests avec couverture
npm run test:coverage

# Tests end-to-end
npm run test:e2e
```

### **Linting**
```bash
# Vérifier le code
npm run lint

# Corriger automatiquement
npm run lint:fix
```

## 🇨🇮 **Spécificités Marché Ivoirien**

### **Adaptation Locale**
- Respecter les spécificités du marché ivoirien
- Utiliser les formats de téléphone locaux (+225)
- Intégrer les zones de livraison d'Abidjan
- Supporter les providers de paiement locaux

### **Mobile Money**
- Tester avec les vrais numéros de test
- Respecter les limites de transaction
- Implémenter les callbacks sécurisés
- Gérer les timeouts réseau

### **Géolocalisation**
- Utiliser les adresses réelles d'Abidjan
- Tester les calculs de distance
- Vérifier les zones de livraison
- Optimiser pour la connectivité mobile

## 📝 **Process de Review**

### **Avant de Soumettre**
1. ✅ Tests passent
2. ✅ Linting OK
3. ✅ Documentation mise à jour
4. ✅ Pas de conflits avec main
5. ✅ Fonctionnalité testée manuellement

### **Pull Request**
```markdown
## Description
Brève description des changements

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests manuels effectués
- [ ] Tests sur mobile (si applicable)

## Checklist
- [ ] Code suit les standards du projet
- [ ] Auto-review effectuée
- [ ] Documentation mise à jour
- [ ] Pas de console.log oubliés
```

### **Review Process**
1. **Automated Checks** : Tests, linting, build
2. **Code Review** : Au moins 1 approbation requise
3. **Manual Testing** : Test des fonctionnalités critiques
4. **Merge** : Squash and merge préféré

## 🌍 **Expansion Panafricaine**

### **Nouveaux Pays**
- Rechercher les providers de paiement locaux
- Adapter les formats de téléphone
- Intégrer les devises locales
- Respecter les réglementations

### **Providers de Paiement**
- Implémenter les SDKs officiels
- Gérer les webhooks sécurisés
- Tester en mode sandbox
- Documenter l'intégration

## 🆘 **Besoin d'Aide ?**

### **Ressources**
- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/topsucces-code/wali-livraison/issues)
- 💬 [Discussions](https://github.com/topsucces-code/wali-livraison/discussions)

### **Contact**
- **Email** : contact@wali-livraison.ci
- **GitHub** : [@topsucces-code](https://github.com/topsucces-code)

## 🎯 **Priorités Actuelles**

### **High Priority**
- 🔧 Finalisation backend API
- 📱 Applications mobiles React Native
- 🧪 Tests end-to-end complets
- 🚀 Déploiement production

### **Medium Priority**
- 📊 Dashboard analytics
- 🤖 IA prédictive
- 🔔 Notifications push
- 🌐 Internationalisation

### **Low Priority**
- 🎨 Thèmes personnalisés
- 🔌 Intégrations tierces
- 📈 Métriques avancées
- 🛡️ Sécurité renforcée

## 📜 **Code de Conduite**

### **Nos Engagements**
- Respecter tous les contributeurs
- Maintenir un environnement inclusif
- Accepter les critiques constructives
- Se concentrer sur l'amélioration continue

### **Comportements Attendus**
- Communication respectueuse
- Collaboration constructive
- Partage des connaissances
- Aide aux nouveaux contributeurs

### **Comportements Inacceptables**
- Harcèlement ou discrimination
- Langage offensant
- Attaques personnelles
- Spam ou trolling

---

**Merci de contribuer à WALI Livraison ! Ensemble, révolutionnons la livraison en Afrique ! 🌍🚚**
