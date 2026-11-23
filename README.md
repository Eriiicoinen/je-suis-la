# Je suis là : MVP

Webapp hors-ligne pour accompagner sa partenaire pendant le travail.
Aucune installation de logiciel, aucun serveur, aucune donnée envoyée.

## Mettre l'app sur ton téléphone (5 minutes)

L'app doit être servie en **HTTPS** pour s'installer et marcher hors-ligne.

### Option la plus simple : Netlify Drop
1. Va sur https://app.netlify.com/drop (compte gratuit).
2. Glisse-dépose **le dossier `app`** entier.
3. Netlify te donne une adresse en `https://…netlify.app`.
4. Ouvre-la sur ton téléphone :
   - **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil »
   - **Android (Chrome)** : menu ⋮ → « Installer l'application »
5. Ouvre l'app une fois avec du réseau : ensuite elle marche **sans réseau**.

### Tester sur l'ordinateur
```
cd app
python -m http.server 8765
```
puis ouvre http://localhost:8765

## À faire AVANT le jour J
- [ ] Onglet **Maternité** : nom + numéro + consignes de départ exactes de ta maternité
- [ ] Parcourir les fiches **avec ta compagne**, marquer ❤️ / 👎
- [ ] S'entraîner à 2 ou 3 positions et à la respiration
- [ ] Montrer le contenu à votre sage-femme et noter ses corrections

## Nouveautés v8
- **Êtes-vous prêts ?** : jauge de préparation + compte à rebours J-x (terme prévu), qui se coche toute seule à partir de ce que vous faites dans l'app.
- **Minuteur plus fiable** : alerte « FIN oubliée ? » (une contraction restée « en cours » faussait tout), suppression d'une ligne, repère calculé sur la *série régulière* (un faux travail d'il y a 3 jours ne compte plus), barre de progression vers le repère, tendance « se rapprochent / s'espacent », vibration quand le repère est atteint.
- **Si ça ne se passe pas comme prévu** : déclenchement, travail long, instruments, césarienne, bébé en soins, malaise du partenaire, accouchement inopiné (15).
- **Faire-part en image** (photo optionnelle, 3 styles), prêt à envoyer. La photo ne quitte pas le téléphone.
- **Démarches** : check-list avec la date limite de déclaration de naissance calculée (week-ends et jours fériés reportés).
- **Maternité** : adresse → itinéraire en un geste, notes d'accès (entrée de nuit…).
- **Sons doux** pour la respiration (utile sur iPhone, sans vibration), accords fille/garçon, sauvegarde/restauration en fichier.
- Corrections : l'écran ne s'éteint plus en passant du minuteur au coach ; la respiration/voix ne continue plus en arrière-plan après un re-rendu ; mise à jour de l'app signalée proprement.

## Nouveautés v9
- **Carnet des premiers jours** : tétées (sein gauche/droit), biberons, pipis, selles en un geste, « dernier repas il y a… », totaux sur 24 h, résumé à copier pour la sage-femme. Il compte, il n'interprète pas.
- **Ses mots à elle** (écran « Quoi lui dire ») : les phrases qu'elle veut entendre, affichées en premier dans le mode coach.
- **Check-list de départ** : s'ouvre quand tu notes « Départ de la maison » (appel maternité, itinéraire, accès, rien oublié).
- **Questions à poser** à la maternité avant le jour J.
- **Photos à ne pas manquer** : la liste pour celui qui tient l'appareil.

## Nouveautés v10
- **Accueil en trois temps** : Avant / Jour J / Après. L'app choisit seule (première contraction notée → Jour J ; « Bébé est né » → Après), et tu peux changer d'un geste.
- **Premier lancement** : terme prévu, numéro de la maternité, 1er bébé ou non, et l'app est réglée.
- **Mode nuit rouge en un geste** depuis l'accueil (bouton 🌙 en haut à droite).
- **Filet de sécurité** : si un écran plante, on affiche l'appel maternité, le 15 et le minuteur au lieu d'un écran blanc.
- **Récit de naissance** : les positions essayées et leur durée s'y ajoutent.
- **Ses souhaits** : impression ou PDF pour le dossier de la maternité.
- **Quiz** : 5 nouvelles situations (césarienne, naissance imminente à la maison, malaise…).
- **Raccourcis** sur l'icône (appui long, Android) : Minuteur, Coach, Maternité.
- Page de présentation (`landing/`) mise à jour avec les nouvelles fonctions.

## Nouveautés v11 : refonte visuelle
- **Dessins refaits** : silhouettes pleines (buste, membres épais), cheveux qui donnent le sens du visage, plus de superpositions transparentes. Tout vient de `tools/gen-pictos.js` : modifie une pose puis lance `node tools/gen-pictos.js`.
- **Interface** : en-tête d'accueil compact, cartes d'action avec pastille, tuiles de phase teintées, boutons avec relief et réponse au toucher, barre du bas avec de vraies icônes, mode nuit rouge revu pour rester sans aucune lumière claire.

## Nouveautés v12 : « Son compagnon » ou « Sa compagne »
- Un réglage (premier lancement, puis onglet **Maternité** → « Tu es… ») adapte l'app à un couple de femmes.
- **Dessins** : un second jeu dans `img/f/`, où la partenaire a les cheveux mi-longs. Généré par le même `node tools/gen-pictos.js`.
- **Accords** : prêt / prête, fier / fière, présent / présente… Dans `content.js`, écris `prêt{|e}` ou `fi{er|ère}` : la forme avant la barre est au masculin, celle après au féminin.
- **Démarches** : reconnaissance conjointe anticipée (acte du notaire) et congé d'accueil de l'enfant. À faire vérifier comme le reste.

## Nouveautés v13 : « Et toi ? »
- **Nouvel écran Et toi ?** (`#/calme`) pour garder son calme et tenir, pour le ou la partenaire.
- **SOS 60 secondes** : cinq consignes courtes (ancrage, expiration longue, relâchement, regard, gorgée d'eau) sur une respiration lente 4 s / 6 s, avec barre de progression et guide vocal si activé.
- **Dis-toi** : phrases à se répéter soi-même.
- **Ce qui impressionne, mais est souvent normal** : cris, « je n'y arriverai pas », tremblements, monitoring, salle qui se remplit, bébé violacé…
- **Avant / Pendant / Après** : se préparer, tenir sur la durée, prendre soin de soi après (dépression des partenaires, 3114).
- Accès depuis l'accueil (Avant, Jour J, Après) et le mode coach entre deux contractions. « SOS calme essayé une fois » s'ajoute à « Êtes-vous prêts ? » et se coche tout seul.
- Contenu dans `content.js` → `calm`, **à faire relire par une sage-femme**.

## Vérifier après une modification
```
node tools/smoke-test.js
```
Rend chaque écran dans plusieurs situations (vide, travail en cours, contraction oubliée, naissance, version payante) et signale toute erreur.

## Modifier le contenu
Tout le texte est dans `content.js` (positions, phrases, check-list, signes d'alerte).
Après modification, change `VERSION` dans `sw.js` (ex. `jsl-v2`) pour que le téléphone récupère la nouvelle version.

## Fichiers
| Fichier | Rôle |
|---|---|
| `index.html` | Page et barre de navigation |
| `styles.css` | Thème sombre, gros boutons |
| `app.js` | Écrans, minuteur, respiration, stockage local |
| `content.js` | Contenu (à faire valider par une sage-femme) |
| `sw.js` | Fonctionnement hors-ligne |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil |
