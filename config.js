// Réglages de monétisation. Change VERSION dans sw.js après chaque modification.
window.APP_CONFIG = {
  // false = tout est gratuit (version perso). Passe à true quand la boutique est prête.
  paywall: false,

  price: "4,99 €",

  // Lien de paiement Polar ou Lemon Squeezy (page de checkout du produit).
  checkoutUrl: "",

  // Fonction Netlify qui vérifie la clé de licence auprès du prestataire de paiement.
  activateEndpoint: "/.netlify/functions/activate",

  // Positions accessibles gratuitement (les signes d'alerte, le minuteur,
  // la respiration et l'onglet Maternité restent toujours gratuits).
  freePositions: ["marcher", "ballon", "quatre-pattes", "cote-coussin"],

  // Lien de la page de présentation, proposé après la naissance (« Recommander l'app »).
  // Vide = le bouton est masqué.
  shareUrl: "",

  // Nombre de phrases « Quoi lui dire » visibles gratuitement.
  freeSay: 3,

  // Mode jour J : si le travail a commencé (contractions notées), tout est
  // débloqué automatiquement. On ne demande jamais de payer pendant un accouchement.
  dayJ: { minContractions: 3, windowH: 2, unlockH: 24 }
};
