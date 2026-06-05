# SIGMET Generator GMMM

Application de generation de messages SIGMET pour la FIR Casablanca (GMMM).

## Fonctionnalites

- Carte interactive avec la FIR Casablanca
- Dessin de polygones (WI) et lignes (E/W/N/S OF LINE) jusqu'a 4 points
- Generation automatique de SIGMET au format OACI
- Radar orages en temps reel (RainViewer)
- Heure de debut et duree de validite configurables (1-4H)

## Deploiement sur Render.com (GRATUIT)

### Etape 1 : Creer un compte
1. Allez sur https://render.com
2. Cliquez sur **Sign Up** (inscription avec email ou GitHub)
3. Verifiez votre email

### Etape 2 : Creer un nouveau Web Service
1. Sur le dashboard Render, cliquez **New +**
2. Selectionnez **Web Service**
3. Choisissez **Deploy from Git repository** OU **Upload files**

### Etape 3 : Uploader les fichiers (sans Git)
1. Creez un dossier zip contenant TOUS les fichiers du projet
2. Sur Render, selectionnez **Upload files** au lieu de Git
3. Uploadez le zip

### Etape 4 : Configuration
Remplissez les champs :

| Champ | Valeur |
|-------|--------|
| **Name** | `sigmet-gmmm` (ou le nom que vous voulez) |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

### Etape 5 : Deployer
1. Cliquez sur **Create Web Service**
2. Render va automatiquement :
   - Installer les dependances (`npm install`)
   - Builder le frontend React (`npm run build`)
   - Lancer le serveur (`npm start`)
3. Attendez 2-3 minutes que le deploiement finisse
4. Votre URL sera : `https://sigmet-gmmm.onrender.com`

### Etape 6 : Partager
Copiez l'URL et envoyez-la a vos collegues !

## Structure du projet

```
├── dist/                 # Frontend build (genere automatiquement)
├── src/
│   ├── App.tsx           # Application principale
│   ├── index.css         # Styles
│   └── ...
├── server.cjs            # Backend Node.js (API eclairs + radar)
├── package.json
└── README.md
```

## API Backend

- `GET /api/health` - Verifie que le serveur fonctionne
- `GET /api/lightning` - Donnees de foudre (Blitzortung)
- `GET /api/radar-timestamp` - Timestamp radar RainViewer

## Notes

- Le plan gratuit de Render s'eteint apres 15 min d'inactivite (se reveille a la 1ere visite)
- Les eclairs Blitzortung necessitent un compte (gratuit sur blitzortung.org)
- Le radar RainViewer fonctionne sans compte et couvre le monde entier
