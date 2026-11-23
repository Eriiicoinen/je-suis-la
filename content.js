// Contenu de l'application — BROUILLON à faire relire par une sage-femme.
// Séparé du code pour pouvoir le corriger / traduire sans toucher à app.js.

window.CONTENT = {
  phases: [
    {
      id: "latence",
      emoji: "🌙",
      title: "Début du travail",
      sub: "Contractions irrégulières, souvent à la maison",
      tips: [
        "Économiser l'énergie : alterner mouvement et repos.",
        "Boire et manger léger, proposer sans insister.",
        "Lancer le minuteur quand les contractions deviennent régulières.",
        "Garder une ambiance calme : lumière douce, musique, peu de monde."
      ]
    },
    {
      id: "actif",
      emoji: "🔥",
      title: "Travail actif",
      sub: "Contractions rapprochées et intenses",
      tips: [
        "Changer de position toutes les 30 à 60 min (ou dès qu'elle le demande).",
        "Pendant la contraction : peu de mots, ta présence, ton toucher, ta respiration lente.",
        "Entre deux contractions : eau, gant frais, toilettes toutes les heures.",
        "Si ça ne lui fait pas du bien, on change. C'est elle qui décide."
      ]
    },
    {
      id: "transition",
      emoji: "⚡",
      title: "Transition",
      sub: "Le moment le plus dur : « je n'y arriverai pas »",
      tips: [
        "C'est souvent le signe que la naissance approche.",
        "Reste calme, très proche, voix basse et lente.",
        "« Une à la fois. Juste celle-là. »",
        "Nausées, tremblements, chaud/froid : fréquents. Préviens l'équipe.",
        "Si elle sent une envie de pousser : préviens la sage-femme."
      ]
    },
    {
      id: "poussee",
      emoji: "💪",
      title: "Poussée & naissance",
      sub: "L'équipe guide, tu soutiens",
      tips: [
        "Suis les consignes de la sage-femme : c'est elle qui guide la poussée.",
        "Soutiens une jambe, sa tête ou son dos selon la position.",
        "Encourage entre les poussées, rafraîchis-lui le visage.",
        "Pense au peau à peau et aux photos si vous l'avez souhaité."
      ]
    }
  ],

  // epi = compatible avec une péridurale (avec l'aide de l'équipe)
  positions: [
    {
      id: "marcher",
      emoji: "🚶",
      title: "Marcher, rester active",
      phases: ["latence", "actif"],
      epi: false,
      equipment: [],
      steps: [
        "Marchez ensemble, à son rythme (couloir, chambre, dehors si vous êtes encore à la maison).",
        "À la contraction : on s'arrête, elle s'appuie sur toi ou sur un mur.",
        "Elle peut balancer le bassin pendant la contraction."
      ],
      partner: "Offre ton épaule ou tes avant-bras, accompagne le balancement. Repars quand elle est prête.",
      why: "La gravité et le mouvement aident le bébé à descendre et à bien s'orienter.",
      caution: "Alterner avec du repos pour ne pas l'épuiser."
    },
    {
      id: "ballon",
      emoji: "🔵",
      title: "Ballon : bascules et cercles",
      phases: ["latence", "actif"],
      epi: false,
      equipment: ["Ballon de naissance"],
      steps: [
        "Elle s'assoit sur le ballon, pieds bien à plat, genoux plus bas que les hanches.",
        "Elle fait des bascules d'avant en arrière ou des cercles avec le bassin.",
        "Pendant la contraction, elle peut se pencher vers toi."
      ],
      partner: "Assieds-toi face à elle ou derrière, stabilise le ballon, masse le bas de son dos.",
      why: "Mobilise le bassin, soulage le bas du dos, aide la descente du bébé.",
      caution: "Toujours quelqu'un à côté pour la stabiliser."
    },
    {
      id: "eau-chaude",
      emoji: "🚿",
      title: "Douche ou bain chaud",
      phases: ["latence", "actif"],
      epi: false,
      equipment: ["Douche ou baignoire"],
      steps: [
        "Eau chaude (pas brûlante), elle peut s'asseoir sur un tabouret ou le ballon.",
        "Diriger le jet sur le bas du dos ou le ventre pendant les contractions.",
        "Bain : seulement si les eaux ne sont pas rompues ou si la maternité le permet."
      ],
      partner: "Prépare l'eau, tiens le pommeau sur la zone qui fait mal, surveille qu'elle ne glisse pas.",
      why: "La chaleur détend les muscles et diminue la douleur ressentie.",
      caution: "Vérifier la température. Demander l'avis de la maternité pour le bain."
    },
    {
      id: "chaise-envers",
      emoji: "🪑",
      title: "Assise à l'envers sur une chaise",
      phases: ["latence", "actif"],
      epi: false,
      equipment: ["Chaise", "Coussin"],
      steps: [
        "Elle s'assoit à califourchon, face au dossier.",
        "Coussin sur le dossier, elle pose ses bras et sa tête dessus.",
        "Elle peut bouger légèrement le bassin."
      ],
      partner: "Masse ses épaules et le bas de son dos, appuie sur le sacrum pendant la contraction.",
      why: "Repos actif : elle se repose tout en gardant le bassin ouvert et penché en avant.",
      caution: ""
    },
    {
      id: "slow-dance",
      emoji: "💃",
      title: "Slow dance",
      phases: ["actif", "transition"],
      epi: false,
      equipment: [],
      steps: [
        "Debout face à toi, elle passe ses bras autour de ton cou et se laisse aller contre toi.",
        "Vous balancez doucement d'un pied sur l'autre.",
        "Elle relâche les épaules et la mâchoire."
      ],
      partner: "Porte une partie de son poids, masse le bas de son dos, respire lentement à son oreille.",
      why: "Gravité + balancement + contact rassurant : très apprécié en travail actif.",
      caution: "Plie un peu les genoux et garde le dos droit pour ne pas te faire mal."
    },
    {
      id: "quatre-pattes",
      emoji: "🐾",
      title: "À quatre pattes + pression sur le sacrum",
      phases: ["actif", "transition", "poussee"],
      epi: false,
      equipment: ["Tapis ou lit", "Ballon (option)"],
      steps: [
        "Elle se met à quatre pattes, ou à genoux le buste penché sur le ballon.",
        "Elle peut faire le dos rond / dos creux entre les contractions.",
        "Pendant la contraction : tu appuies sur son sacrum."
      ],
      partner: "Paume à plat sur le sacrum (os plat en bas du dos, au-dessus des fesses). Appuie fort et régulier pendant toute la contraction. Demande-lui : « plus fort ? moins fort ? »",
      why: "Soulage les douleurs lombaires, surtout si le bébé est « dos contre dos ».",
      caution: "Un coussin sous les genoux. Changer si ses poignets fatiguent."
    },
    {
      id: "hanches",
      emoji: "🤲",
      title: "Compression des hanches",
      phases: ["actif", "transition"],
      epi: false,
      equipment: [],
      steps: [
        "Elle se penche en avant (lit, ballon, mur, toi).",
        "Place tes deux paumes sur le haut de ses fesses, de chaque côté.",
        "Pendant la contraction : pousse vers le centre et légèrement vers le haut."
      ],
      partner: "C'est toi qui appuies, et souvent fort. Tiens toute la contraction, relâche à la fin. Ajuste selon ce qu'elle dit.",
      why: "Ouvre la partie basse du bassin et soulage beaucoup de femmes au pic de la contraction.",
      caution: "Arrête si ça augmente la douleur."
    },
    {
      id: "genoux-lit",
      emoji: "🛏️",
      title: "À genoux contre le dossier du lit",
      phases: ["actif", "transition", "poussee"],
      epi: false,
      equipment: ["Lit de salle de naissance"],
      steps: [
        "On relève le dossier du lit au maximum.",
        "Elle se met à genoux sur le lit, face au dossier, bras et tête posés dessus (coussin).",
        "Elle peut balancer le bassin."
      ],
      partner: "Masse son dos, pression sur le sacrum, gant frais sur la nuque, eau entre les contractions.",
      why: "Libère le bassin, utilise la gravité, repose ses jambes.",
      caution: "Demander à l'équipe de régler le lit."
    },
    {
      id: "fente",
      emoji: "🦵",
      title: "Fente asymétrique",
      phases: ["actif"],
      epi: false,
      equipment: ["Chaise ou marchepied"],
      steps: [
        "Debout, elle pose un pied sur une chaise, genou ouvert vers l'extérieur.",
        "Pendant la contraction, elle se penche doucement vers la jambe levée.",
        "Changer de côté régulièrement (ou garder le côté qui soulage)."
      ],
      partner: "Tiens-la bien face à elle ou sur le côté, stabilise la chaise.",
      why: "Ouvre un côté du bassin, peut aider le bébé à tourner et à s'engager.",
      caution: "Bien la stabiliser : risque de déséquilibre."
    },
    {
      id: "suspension",
      emoji: "🧗",
      title: "Suspension",
      phases: ["actif", "transition", "poussee"],
      epi: false,
      equipment: ["Liane ou écharpe (si la salle en a une)"],
      steps: [
        "Elle se suspend à ton cou, à une liane ou à une écharpe.",
        "Genoux fléchis, elle se laisse descendre et relâche son poids.",
        "Elle se relève entre les contractions."
      ],
      partner: "Pieds bien ancrés, genoux pliés, dos droit. Contre un mur si besoin pour être stable.",
      why: "Étire le dos, ouvre le bassin, la gravité travaille.",
      caution: "Protège ton dos. Ne la laisse pas tomber : fais-toi aider si besoin."
    },
    {
      id: "accroupie",
      emoji: "🧎",
      title: "Accroupie soutenue",
      phases: ["poussee"],
      epi: false,
      equipment: [],
      steps: [
        "Toi debout ou assis{|e} derrière elle, elle s'accroupit en se tenant à toi.",
        "Elle garde les pieds à plat si possible.",
        "Se relever entre les poussées."
      ],
      partner: "Soutiens-la sous les aisselles ou par les avant-bras. Suis les consignes de la sage-femme.",
      why: "Ouvre largement le bassin et utilise la gravité.",
      caution: "Très fatigant : alterner. Uniquement si l'équipe est d'accord."
    },
    {
      id: "cote-coussin",
      emoji: "🛌",
      title: "Sur le côté, coussin entre les jambes",
      phases: ["latence", "actif", "transition", "poussee"],
      epi: true,
      equipment: ["Coussin d'allaitement ou coussin « cacahuète »"],
      steps: [
        "Elle s'allonge sur le côté, un gros coussin entre les genoux et les chevilles.",
        "La jambe du dessus est bien avancée et soutenue.",
        "Changer de côté toutes les 30 à 60 min."
      ],
      partner: "Place et ajuste le coussin, aide au retournement (avec l'équipe si péridurale), masse son dos.",
      why: "Repos tout en gardant le bassin ouvert. Position de référence sous péridurale.",
      caution: "Sous péridurale : changer de côté avec l'aide de l'équipe."
    },
    {
      id: "semi-assise",
      emoji: "📐",
      title: "Semi-assise asymétrique",
      phases: ["actif", "poussee"],
      epi: true,
      equipment: ["Lit", "Coussins"],
      steps: [
        "Dossier relevé, elle est semi-assise (pas à plat sur le dos).",
        "Une jambe repliée et ouverte, l'autre allongée, ou un coussin sous une fesse.",
        "Alterner le côté."
      ],
      partner: "Aide à placer les coussins, soutiens une jambe pendant la poussée si on te le demande.",
      why: "Évite la position à plat sur le dos et garde le bassin mobile.",
      caution: "Suivre les indications de l'équipe."
    },
    {
      id: "tailleur",
      emoji: "🧘",
      title: "Demi-assise en tailleur",
      phases: ["actif"],
      epi: true,
      equipment: ["Lit", "Coussins sous les genoux"],
      steps: [
        "Dossier relevé, elle est assise jambes croisées en tailleur ou plantes de pieds collées.",
        "Coussins sous les genoux pour ne pas forcer.",
        "Elle reste ainsi un moment puis change de position."
      ],
      partner: "Installe les coussins, vérifie qu'elle est confortable.",
      why: "Ouvre le bassin même avec des jambes engourdies.",
      caution: "Uniquement si l'équipe valide."
    },
    {
      id: "massage",
      emoji: "✋",
      title: "Massage et toucher",
      phases: ["latence", "actif", "transition"],
      epi: true,
      equipment: ["Huile de massage (option)"],
      steps: [
        "Bas du dos : mouvements lents, paumes à plat, ou cercles avec les pouces.",
        "Épaules, mains, pieds, cuir chevelu : selon ce qu'elle aime.",
        "Effleurements très légers sur le ventre ou le dos entre les contractions."
      ],
      partner: "Demande-lui ce qu'elle préfère, et accepte qu'elle ne veuille plus être touchée à un moment.",
      why: "Le toucher détend et aide à supporter la douleur.",
      caution: "Sous péridurale : ne pas toucher la zone du cathéter dans le dos."
    }
  ],

  say: [
    "Je suis là.",
    "Tu es incroyable.",
    "Une à la fois. Juste celle-là.",
    "Celle-là est passée. Repose-toi.",
    "Relâche les épaules… relâche la mâchoire.",
    "Longue expiration… comme ça.",
    "Ton corps sait faire.",
    "Chaque contraction rapproche notre bébé.",
    "Tu veux que je change quelque chose ?",
    "Je suis fi{er|ère} de toi."
  ],

  avoid: [
    "Poser des questions pendant une contraction (attends qu'elle soit passée).",
    "« Ça fait mal ? » ou « Ça va bientôt finir ? »",
    "Comparer avec d'autres accouchements.",
    "Regarder ton téléphone ou tes messages (sauf cette app 😉).",
    "Parler avec l'équipe au-dessus d'elle comme si elle n'était pas là.",
    "Prendre mal un « ne me touche pas » : c'est normal, ça peut changer."
  ],

  checklist: [
    { id: "eau", text: "Lui proposer de l'eau (avec une paille) après chaque contraction ou presque" },
    { id: "wc", text: "Lui proposer d'aller aux toilettes toutes les heures" },
    { id: "pos", text: "Changer de position toutes les 30 à 60 min" },
    { id: "gant", text: "Gant ou linge frais pour le visage et la nuque" },
    { id: "levres", text: "Baume pour les lèvres" },
    { id: "lumiere", text: "Lumière tamisée, porte fermée, calme" },
    { id: "musique", text: "Sa playlist, volume bas" },
    { id: "toi", text: "Toi aussi : boire, manger un truc, souffler 2 min" }
  ],

  alerts: [
    "Saignement plus abondant que des pertes rosées",
    "Perte des eaux (surtout si le liquide est vert, marron ou malodorant)",
    "Le bébé bouge beaucoup moins",
    "Fièvre, maux de tête intenses, troubles de la vue",
    "Douleur continue, sans répit entre les contractions",
    "Malaise, essoufflement"
  ],

  // ---------- Et toi ? Garder ton calme (brouillon à faire relire par une sage-femme) ----------
  calm: {
    intro: "Elle se cale sur ta voix et ta respiration : ton calme l'aide vraiment. Et le calme, ça s'entraîne.",
    // SOS : 60 secondes, une consigne toutes les 12 s, respiration 4 s / 6 s en fond
    sos: [
      "Pose les deux pieds à plat. Sens le sol sous toi.",
      "Inspire par le nez… et expire très longuement par la bouche.",
      "Relâche la mâchoire. Laisse tomber les épaules.",
      "Regarde trois choses autour de toi. Nomme-les dans ta tête.",
      "Une gorgée d'eau si tu peux. Puis tu y retournes : ta main, ta voix lente."
    ],
    selfTalk: [
      "Je n'ai pas besoin de tout contrôler. J'ai besoin d'être là.",
      "Une contraction à la fois. Pour moi aussi.",
      "L'équipe s'occupe du médical. Moi, je m'occupe d'elle.",
      "Si je ne sais pas, je demande.",
      "Ce qu'elle vit est intense, pas forcément anormal."
    ],
    sections: [
      { id: "normal", emoji: "😮", title: "Ce qui impressionne, mais est souvent normal",
        intro: "Le savoir à l'avance évite la panique sur le moment. Au moindre doute, demande à l'équipe : elle préfère une question à ton inquiétude.",
        items: [
          "Elle crie, gémit, grogne : le son aide souvent à traverser la contraction.",
          "« Je n'en peux plus », « Je n'y arriverai pas » : c'est fréquent juste avant la poussée. Ce n'est pas le moment de la croire, c'est le moment de l'encourager.",
          "Elle tremble, claque des dents, a la nausée ou vomit : fréquent à la fin du travail ou sous péridurale.",
          "Elle se ferme, ne te répond plus, te repousse : elle est concentrée, pas fâchée contre toi.",
          "Le monitoring sonne, le rythme du bébé varie : l'équipe le surveille. Demande ce que ça veut dire si ça t'inquiète.",
          "La salle se remplit d'un coup au moment de la naissance : c'est l'organisation habituelle.",
          "Bébé naît violacé, couvert d'un enduit blanc, ne crie pas dans la seconde : l'équipe sait exactement quoi faire.",
          "Du sang à la naissance : une certaine quantité est attendue, et l'équipe la surveille de près."
        ] },
      { id: "avant", emoji: "🗓️", title: "Avant le jour J : se préparer, soi",
        items: [
          "Fais le SOS 60 secondes deux ou trois fois avant le terme : le jour J, ton corps s'en souviendra.",
          "Visite la maternité si c'est possible : l'inconnu nourrit le stress.",
          "Dis-lui tes peurs à toi, et demande-lui ce qui la rassurerait chez toi ce jour-là.",
          "Choisis une personne à appeler pour toi (pas pour donner des nouvelles) si tu as besoin de souffler.",
          "Prépare tes encas et ta bouteille d'eau dans le sac (Sac → Pour toi).",
          "Dors : dans les dernières semaines, couche-toi tôt dès que tu peux. Le travail commence souvent la nuit."
        ] },
      { id: "pendant", emoji: "⏱️", title: "Pendant : tenir sur la durée",
        items: [
          "Ralentis volontairement ta voix et ta respiration : elle s'y cale sans s'en rendre compte.",
          "Tu n'as pas à tout savoir. Ton rôle, c'est d'être là, pas d'être sage-femme.",
          "Une seule chose à la fois : la contraction en cours, puis la gorgée d'eau, puis le reste.",
          "Mange quelque chose toutes les deux ou trois heures et bois souvent, même sans faim.",
          "Quand l'équipe est avec elle : préviens, sors deux minutes, respire, reviens.",
          "Si la péridurale lui permet de dormir, dors aussi.",
          "Une inquiétude ? Pose ta question à l'équipe entre deux contractions, et à l'écart si elle risque de l'inquiéter.",
          "Le téléphone reste dans la poche : un message prêt aux proches, et c'est tout."
        ] },
      { id: "apres", emoji: "🌱", title: "Après : prendre soin de toi aussi",
        items: [
          "Raconte ta version de la naissance à quelqu'un dans les jours qui suivent : tu as vécu un moment intense, toi aussi.",
          "Le manque de sommeil rend tout plus dur : relayez-vous, acceptez l'aide proposée.",
          "Si, après quelques semaines, des images reviennent, si tu dors mal ou évites d'y penser : parles-en à ton médecin. Ça arrive aussi aux partenaires.",
          "Les partenaires aussi peuvent faire une dépression après une naissance. Irritabilité, repli, travail à outrance ou alcool en sont parfois les signes. Ça se soigne.",
          "Idées noires : appelle le 3114 (24 h/24, gratuit). Urgence : le 15."
        ] }
    ]
  },

  // ---------- Mode coach ----------
  coach: {
    defaultCue: "Respire avec elle, lentement, à voix basse. Expire longuement pour lui donner le rythme.",
    stages: [
      { upTo: 0.35, label: "Ça monte…", hint: "Reste calme, respire avec elle." },
      { upTo: 0.65, label: "Le pic", hint: "C'est le plus intense. « Tu y es presque. »" },
      { upTo: 1.0, label: "Ça redescend", hint: "« Elle s'en va… relâche. »" },
      { upTo: 99, label: "Elle dure un peu plus", hint: "Normal : chaque contraction est différente." }
    ]
  },

  // ---------- Montre-moi : elle pointe, tu agis ----------
  board: [
    { id: "soif", emoji: "💧", her: "J'ai soif", you: "Une petite gorgée d'eau avec une paille, après la contraction.", log: "boire" },
    { id: "chaud", emoji: "🥵", her: "J'ai chaud", you: "Gant frais sur le front et la nuque, éventail, fenêtre si possible." },
    { id: "froid", emoji: "🥶", her: "J'ai froid", you: "Couverture, chaussettes, gilet. Les frissons sont fréquents." },
    { id: "masse", emoji: "✋", her: "Masse-moi", you: "Bas du dos, paumes à plat. Demande : plus fort ? plus bas ?" },
    { id: "touche", emoji: "🚫", her: "Ne me touche pas", you: "Retire tes mains, reste tout près. Ce n'est pas contre toi." },
    { id: "silence", emoji: "🤫", her: "Silence", you: "Plus un mot. Juste ta présence et ta respiration lente." },
    { id: "lumiere", emoji: "💡", her: "Moins de lumière", you: "Baisse la lumière, ferme la porte, coupe les écrans." },
    { id: "musique", emoji: "🎵", her: "Musique", you: "Lance ou change sa playlist, volume bas. Ou coupe-la." },
    { id: "wc", emoji: "🚽", her: "Toilettes", you: "Accompagne-la, aide-la à se relever entre deux contractions.", log: "wc" },
    { id: "position", emoji: "🔄", her: "Je veux changer de position", you: "Propose 2 positions qu'elle aime (❤️), aide-la à bouger.", link: "#/" },
    { id: "nausee", emoji: "🤢", her: "Nausée", you: "Haricot ou sac, gant frais. Préviens l'équipe si ça dure." },
    { id: "peur", emoji: "😰", her: "J'ai peur", you: "Regarde-la, voix calme : « Je suis là. Tu es en sécurité. Une à la fois. »" },
    { id: "peridurale", emoji: "💉", her: "Je veux parler de la péridurale", you: "Préviens l'équipe maintenant. Soutiens son choix, sans la dissuader." },
    { id: "equipe", emoji: "🔔", her: "Appelle la sage-femme", you: "Sonnette ou couloir, tout de suite. Reviens vite près d'elle." }
  ],

  // ---------- Journal : événements à noter ----------
  events: {
    eaux: { emoji: "💧", label: "Perte des eaux" },
    saignement: { emoji: "🩸", label: "Saignement" },
    depart: { emoji: "🚗", label: "Départ de la maison" },
    arrivee: { emoji: "🏥", label: "Arrivée à la maternité" },
    peridurale: { emoji: "💉", label: "Péridurale posée" },
    note: { emoji: "📝", label: "Note", noSummary: true },
    naissance: { emoji: "🎉", label: "Naissance" }
  },

  // ---------- Après la naissance (brouillon à faire relire par une sage-femme) ----------
  after: [
    { title: "🤱 Les deux premières heures", items: [
      "Le peau à peau : bébé nu sur sa poitrine, une couverture sur le dos de bébé. Protège ce moment.",
      "Tu filtres : pas de visites, pas d'appels. Un seul message aux proches suffit (onglet Messages).",
      "Photos discrètes, sans flash. Demande-lui avant.",
      "La première tétée se fait souvent dans l'heure : l'équipe vous accompagne.",
      "Ton tour de peau à peau viendra aussi : chemise ouverte, bébé contre toi.",
      "Mange et bois quelque chose : ta journée n'est pas finie."
    ] },
    { title: "🏠 Ton rôle les premiers jours", items: [
      "Garde la porte : visites courtes, sur invitation, quand elle le souhaite.",
      "Les repas, l'eau à portée de main, le linge : c'est toi.",
      "Couches, bain, change, portage : tout ce qui n'est pas la tétée, tu peux le faire.",
      "La nuit : tu apportes bébé, tu fais le change, tu le recouches.",
      "Dis-lui ce qu'elle fait bien. Souvent."
    ] },
    { title: "🚨 Pour elle : appeler sans attendre", alert: true, items: [
      "Saignement très abondant (une serviette remplie en moins d'une heure) ou gros caillots",
      "Fièvre (38 °C ou plus), frissons",
      "Douleur intense au ventre, à la cicatrice ou au mollet (rouge, chaud, gonflé)",
      "Essoufflement, douleur dans la poitrine",
      "Maux de tête intenses, troubles de la vue",
      "Malaise, confusion"
    ] },
    { title: "🚨 Pour bébé : appeler sans attendre", alert: true, items: [
      "Respire difficilement, très vite ou avec des pauses",
      "Lèvres ou visage bleus, gris ou très pâles",
      "Fièvre (38 °C ou plus) ou corps froid",
      "Ne boit plus, vomit tout, très difficile à réveiller",
      "Jaunisse qui s'étend ou qui apparaît dès le premier jour"
    ] },
    { title: "💛 Baby blues ou plus ?", items: [
      "Larmes, fatigue, émotions en montagnes russes les premiers jours : très fréquent, ça passe en général en une à deux semaines.",
      "Si la tristesse dure, si elle ne prend plus plaisir à rien, se sent incapable ou a des idées noires : parlez-en sans attendre à la sage-femme ou au médecin.",
      "Toi aussi, tu peux être touché. Ça se soigne : en parler n'est pas une faiblesse.",
      "Idées suicidaires : appelez le 3114 (24 h/24, gratuit). Urgence : le 15."
    ] }
  ],
  // ---------- Si ça ne se passe pas comme prévu (brouillon à faire relire par une sage-femme) ----------
  unexpected: [
    { id: "declenchement", emoji: "⏳", title: "Un déclenchement",
      intro: "Le travail est lancé par l'équipe, à la maternité. Ça peut aller vite comme prendre un jour ou deux.",
      items: [
        "Prévois long : chargeur, encas, de quoi vous occuper. L'attente fait partie du déclenchement.",
        "Tant que rien ne presse : repos, marche, ballon. Demande à l'équipe ce qui est possible avec le monitoring.",
        "Les contractions peuvent devenir intenses assez vite : les positions et la respiration s'appliquent de la même façon.",
        "Demande qu'on vous explique chaque étape. Tu peux poser les questions qu'elle n'a plus l'énergie de poser.",
        "Dormez dès que c'est possible, tous les deux."
      ],
      say: "On a le temps. Je reste avec toi." },
    { id: "long", emoji: "🌗", title: "Un travail très long",
      intro: "Des heures, parfois une nuit entière et plus : c'est fréquent, surtout pour un premier bébé.",
      items: [
        "Entre deux contractions, aide-la à vraiment se relâcher : micro-siestes, lumière basse, silence.",
        "Propose à boire souvent ; pour manger, demande à l'équipe ce qui est permis.",
        "Si elle change d'avis (péridurale, position, ambiance) : c'est son droit. Tu soutiens, sans commenter.",
        "Demande à l'équipe où on en est et ce qui peut aider : changer de position, marcher, se reposer.",
        "Toi aussi tu dois tenir : mange, bois, sors deux minutes prendre l'air quand elle est entourée."
      ],
      say: "Tu fais exactement ce qu'il faut. Une à la fois." },
    { id: "instruments", emoji: "🧑‍⚕️", title: "Ventouse, forceps, spatules",
      intro: "Parfois l'équipe aide bébé à sortir. La salle se remplit d'un coup : c'est l'organisation habituelle, pas forcément un signe de gravité.",
      items: [
        "Reste près de sa tête, tiens sa main, garde une voix calme.",
        "Laisse la place à l'équipe et suis leurs consignes.",
        "Bébé peut avoir une bosse ou des marques sur la tête. Posez vos questions à l'équipe : elle vous dira ce qui est attendu.",
        "Après, elle aura peut-être besoin d'en reparler. Écoute, sans minimiser."
      ],
      say: "Je suis là. Regarde-moi. Tu y es presque." },
    { id: "cesarienne", emoji: "🏥", title: "Une césarienne",
      intro: "Prévue à l'avance ou décidée pendant le travail. Ce n'est pas un échec : c'est une naissance.",
      items: [
        "Demande si tu peux être présent{|e} au bloc : c'est souvent possible, selon la maternité et la situation. En cas d'urgence ou d'anesthésie générale, on te demandera d'attendre à côté.",
        "Au bloc : on t'habille (blouse, charlotte, masque) et on t'installe près de sa tête, derrière un champ. Tu ne vois pas l'opération.",
        "Elle est éveillée. Elle peut sentir qu'on la touche, trembler, avoir froid ou la nausée : dis-le à l'anesthésiste, qui est juste à côté.",
        "Ton rôle : ta main, ton regard, ta voix. Raconte-lui bébé si elle ne le voit pas encore.",
        "Si elle ne peut pas faire le peau à peau tout de suite, propose de le faire toi : chemise ouverte, bébé contre toi.",
        "Si tu attends dehors : c'est long. Respire. On vient te chercher dès que possible.",
        "Les jours suivants : tu lui apportes bébé, tu fais les changes, tu l'aides à se lever. Elle ne porte rien de lourd."
      ],
      say: "Je suis juste là, à côté de toi. Notre bébé arrive." },
    { id: "neonat", emoji: "🍼", title: "Bébé a besoin de soins",
      intro: "Parfois bébé est emmené pour des soins ou une surveillance, quelques minutes ou plus longtemps.",
      items: [
        "Demande-lui ce qu'elle préfère : que tu restes avec elle, ou que tu suives bébé pour qu'il ne soit pas seul.",
        "Près de bébé : parle-lui, il connaît ta voix. Demande si tu peux le toucher ou le prendre en peau à peau.",
        "Prends des photos et des vidéos pour elle, et reviens lui donner des nouvelles.",
        "Note ce que disent les soignants (Minuteur → Journal → Note) : sous le stress, on oublie.",
        "Demande quand elle pourra le voir, et comment démarrer l'allaitement ou tirer son lait si c'est son souhait."
      ] },
    { id: "toi", emoji: "😵‍💫", title: "Et si c'est toi qui te sens mal",
      intro: "Chaleur, émotion, fatigue, vue du sang : ça arrive, et ça n'a rien de honteux.",
      items: [
        "Assieds-toi tout de suite, tête basse, et dis-le à quelqu'un.",
        "Mange et bois régulièrement : à jeun depuis des heures, on tient beaucoup moins bien.",
        "Tu n'es pas obligé de regarder. Reste côté tête : c'est là qu'elle a besoin de toi.",
        "Sortir deux minutes vaut mieux que tomber."
      ] },
    { id: "vite", emoji: "🚨", title: "Bébé arrive et vous n'êtes pas à la maternité", urgent: true,
      intro: "Elle sent que ça pousse et qu'elle ne peut plus se retenir : on ne prend pas la route.",
      items: [
        "Appelle le 15 et mets le haut-parleur : ils te guident pas à pas et envoient une équipe.",
        "Si vous êtes en voiture : arrête-toi dans un endroit sûr, feux de détresse, et appelle.",
        "Installe-la là où elle est bien, au chaud, avec des serviettes propres. Déverrouille la porte d'entrée.",
        "Ne tire jamais sur bébé ni sur le cordon. Ne coupe pas le cordon.",
        "Quand bébé est là : sèche-le, pose-le contre sa peau, couvre-les tous les deux. Note l'heure."
      ] }
  ],

  // ---------- Démarches après la naissance ----------
  admin: {
    note: "Repères pour la France, à vérifier sur service-public.fr ou auprès de la maternité.",
    items: [
      { id: "declaration", title: "Déclarer la naissance", deadlineDays: 5,
        detail: "À la mairie du lieu de naissance (certaines maternités ont un officier d'état civil sur place). À apporter : certificat d'accouchement, pièces d'identité, livret de famille ou {reconnaissance anticipée|reconnaissance conjointe anticipée (l'acte signé chez le notaire avant la PMA : c'est lui qui établit ta filiation)}, déclaration de choix de nom si besoin." },
      { id: "employeur", title: "Prévenir ton employeur",
        detail: "Congé de naissance, puis {congé de paternité et d'accueil de l'enfant|congé d'accueil de l'enfant : c'est le « congé de paternité », ouvert aussi à la compagne de la mère} (une partie se prend juste après la naissance). Envoie l'acte de naissance et vérifie tes dates." },
      { id: "secu", title: "Rattacher bébé à l'Assurance maladie",
        detail: "Depuis le compte ameli ou par courrier : sur ta carte, la sienne, ou les deux." },
      { id: "caf", title: "Déclarer la naissance à la CAF (ou à la MSA)",
        detail: "Dans votre espace en ligne, pour les prestations." },
      { id: "mutuelle", title: "Ajouter bébé à la mutuelle",
        detail: "Envoie l'acte de naissance. Certaines mutuelles versent une prime de naissance." },
      { id: "suivi", title: "Prendre les rendez-vous de suivi",
        detail: "Sage-femme à domicile après la sortie (souvent organisée par la maternité), médecin ou pédiatre pour bébé, et pour elle la consultation postnatale dans les semaines qui suivent." },
      { id: "impots", title: "Signaler la naissance aux impôts",
        detail: "Dans « Gérer mon prélèvement à la source » : votre taux peut baisser." },
      { id: "garde", title: "Confirmer le mode de garde",
        detail: "Crèche, assistante maternelle : annonce la naissance et confirme la date d'arrivée souhaitée." }
    ]
  },

  // ---------- Listes à cocher ----------
  lists: {
    depart: {
      title: "🚗 On part",
      intro: "Trente secondes pour ne rien oublier. Elle s'installe, toi tu vérifies.",
      items: [
        "Sac de maternité et sac de bébé",
        "Dossier de grossesse, carte Vitale, pièces d'identité",
        "Téléphones, chargeur, batterie externe",
        "Clés, portefeuille, de quoi payer le parking",
        "Siège auto dans la voiture",
        "Une serviette sur son siège, un coussin, une bouteille d'eau",
        "Relais prévenu (aînés, animaux)",
        "Maison fermée : four, lumières, porte"
      ]
    },
    questions: {
      title: "❓ Questions à poser",
      intro: "À la prochaine consultation ou à la visite de la maternité. Coche quand tu as la réponse.",
      items: [
        "Quand devons-nous venir ? (écart entre les contractions, depuis combien de temps)",
        "Quel numéro appeler, de jour et de nuit ?",
        "Par quelle entrée passer la nuit ? Où se garer ?",
        "Que faut-il apporter, pour elle, pour bébé, pour moi ?",
        "Y a-t-il un ballon, une baignoire, une liane, un coussin cacahuète ?",
        "Puis-je rester la nuit ? Y a-t-il un lit ou un repas pour l'accompagnant ?",
        "Si une césarienne est décidée, puis-je être présent{|e} ?",
        "Si elle ne peut pas faire le peau à peau tout de suite, puis-je le faire ?",
        "Peut-on déclarer la naissance sur place ?",
        "Quelles sont les règles pour les visites ?"
      ]
    },
    photos: {
      title: "📸 Photos à ne pas manquer",
      intro: "C'est toi qui tiens l'appareil : elle n'aura aucune photo si tu n'y penses pas. Toujours sans flash, et demande-lui avant de partager quoi que ce soit.",
      items: [
        "Elle, pendant le travail (si elle est d'accord) : elle voudra peut-être s'en souvenir",
        "L'horloge de la salle à l'heure de la naissance",
        "Le premier peau à peau",
        "Son regard à elle quand elle découvre bébé",
        "La pesée",
        "Sa main minuscule autour de ton doigt",
        "Ses pieds",
        "Le bracelet de naissance",
        "Toi avec bébé (demande à quelqu'un de la prendre)",
        "Vous trois : tends le téléphone à la sage-femme",
        "La première tenue, le berceau",
        "La sortie de la maternité, le siège auto"
      ]
    }
  },

  waterColors: [
    { id: "clair", label: "Clair" },
    { id: "rose", label: "Rosé" },
    { id: "teinte", label: "Vert / marron", alert: true },
    { id: "nsp", label: "Je ne sais pas" }
  ],

  // ---------- Ses souhaits (à montrer à l'équipe) ----------
  prefsFields: [
    { id: "prenom", label: "Son prénom", type: "text" },
    { id: "apaise", label: "Ce qui l'apaise", type: "text", ph: "Musique douce, qu'on lui tienne la main…" },
    { id: "toucher", label: "Le toucher", type: "choice", options: ["Aime être massée", "Peu de contact", "On verra"] },
    { id: "lumiere", label: "La lumière", type: "choice", options: ["Tamisée", "Peu importe"] },
    { id: "peridurale", label: "La péridurale", type: "choice", options: ["Souhaitée", "Plutôt sans", "On verra le moment venu"] },
    { id: "cordon", label: "Qui coupe le cordon ?", type: "text", ph: "{Le papa|Sa compagne}, la sage-femme…" },
    { id: "peau", label: "Peau à peau", type: "choice", options: ["Oui, tout de suite", "On verra"] },
    { id: "alimentation", label: "Alimentation de bébé", type: "choice", options: ["Allaitement", "Biberon", "On verra"] },
    { id: "autres", label: "Autres souhaits", type: "text", ph: "Photos, présence, langue…" }
  ],

  // ---------- Sac de maternité ----------
  bag: [
    { title: "📄 Papiers", items: ["Carte d'identité", "Carte Vitale + attestation", "Carte de mutuelle", "Dossier de grossesse, échographies, analyses", "Livret de famille ou reconnaissance {anticipée|conjointe anticipée (acte du notaire)}"] },
    { title: "🤰 Pour elle", items: ["Vêtements amples pour le travail", "Brumisateur", "Baume pour les lèvres", "Chaussettes chaudes", "Élastiques à cheveux", "Pyjamas ou chemises ouvertes devant", "Soutiens-gorge d'allaitement", "Culottes jetables ou filet", "Serviettes hygiéniques maternité", "Trousse de toilette, serviette", "Chaussons, peignoir"] },
    { title: "👶 Pour bébé", items: ["5 à 6 bodies", "5 à 6 pyjamas", "Bonnet de naissance", "Chaussons ou chaussettes", "Gilet", "Turbulette ou gigoteuse", "Couverture pour la sortie", "Siège auto installé dans la voiture"] },
    { title: "🧔 Pour toi", items: ["Chargeur + batterie externe", "Encas et bouteilles d'eau", "Monnaie pour le parking et les distributeurs", "Tenue de rechange, brosse à dents", "Sa playlist téléchargée", "Ballon ou coussin si la maternité n'en a pas", "Gilet (les salles sont chaudes ou froides)"] }
  ],

  // ---------- Entraînement ----------
  training: {
    defaults: ["slow-dance", "quatre-pattes", "hanches", "ballon", "cote-coussin", "marcher"],
    practiceMs: 45000,
    tips: [
      "Faites-le à deux, au calme, 2 ou 3 fois avant le terme.",
      "Elle teste, tu fais les gestes : c'est elle qui donne son avis.",
      "Ses ❤️ remonteront en tête de liste le jour J."
    ]
  },
  quiz: [
    { q: "Elle a très mal dans le bas du dos pendant les contractions.",
      a: ["À quatre pattes, et tu appuies sur son sacrum", "Allongée à plat sur le dos", "Assise bien droite sans bouger"],
      why: "Penchée en avant, avec une pression ferme sur le sacrum : c'est souvent ce qui soulage le plus les douleurs lombaires." },
    { q: "La péridurale est posée, elle est allongée dans la même position depuis une heure.",
      a: ["Sur le côté, coussin entre les jambes, puis changer de côté", "Rester sur le dos sans bouger jusqu'à la fin", "Se lever et marcher dans le couloir"],
      why: "Sous péridurale, on peut et on doit encore bouger, avec l'aide de l'équipe : sur le côté, en changeant toutes les 30 à 60 min." },
    { q: "Début du travail, 2 h du matin, contractions encore espacées. Pas de signe d'alerte.",
      a: ["Se reposer sur le côté pour garder des forces", "Marcher deux heures pour accélérer", "Partir tout de suite à la maternité"],
      why: "Le travail est un marathon : au début, on économise l'énergie. Pour partir, suivez les consignes de votre maternité." },
    { q: "Pendant la contraction, elle te serre la main et souffle fort.",
      a: ["Respirer lentement avec elle, presque sans parler", "Lui demander si ça fait mal", "Lui raconter ta journée pour la distraire"],
      why: "Pendant la contraction : peu de mots, ta présence, ta respiration lente qui lui donne le rythme. Les questions, c'est après." },
    { q: "Elle dit : « Je n'y arriverai pas. »",
      a: ["« Une à la fois. Juste celle-là. Je suis là. »", "« Mais si, arrête de dire ça. »", "« Tu veux qu'on rentre à la maison ? »"],
      why: "Ce moment arrive souvent à la transition, juste avant la naissance. On ramène à l'instant présent, une contraction à la fois." },
    { q: "Tu la masses et elle te dit : « Ne me touche pas ! »",
      a: ["Retirer tes mains et rester tout près", "Insister, le massage l'aide", "Sortir de la pièce pour la laisser tranquille"],
      why: "Ce n'est pas contre toi : ses besoins changent vite. Reste présent{|e}, sans toucher, et propose à nouveau plus tard." },
    { q: "Elle perd les eaux à la maison et le liquide est vert.",
      a: ["Appeler la maternité sans attendre", "Attendre que les contractions soient régulières", "Prendre une douche et voir comment ça évolue"],
      why: "Un liquide teinté (vert, marron) fait partie des signes qui doivent faire appeler la maternité immédiatement." },
    { q: "Elle veut changer de position mais elle est épuisée.",
      a: ["Lui proposer 2 positions qu'elle aime et l'aider à bouger", "Lui lister toutes les positions possibles", "Lui dire de rester comme ça"],
      why: "Fatiguée, elle ne veut pas choisir parmi 15 options : propose ses favorites (❤️) et porte une partie de l'effort." },
    { q: "Compression des hanches : où places-tu tes mains ?",
      a: ["Sur le haut de ses fesses, et tu pousses vers le centre", "Sur son ventre, en appuyant doucement", "Sur ses épaules, en tirant vers l'arrière"],
      why: "Paumes sur le haut des fesses, de chaque côté, et pression vers le centre pendant toute la contraction." },
    { q: "Combien de temps garder la même position, en général ?",
      a: ["30 à 60 minutes, ou dès qu'elle le demande", "Le plus longtemps possible", "5 minutes maximum"],
      why: "Bouger régulièrement aide le bébé à descendre et soulage. Mais c'est elle qui décide : si elle est bien, on ne change pas." },
    { q: "L'équipe annonce une césarienne.",
      a: ["Demander si tu peux être présent{|e}, et rester près de sa tête", "Attendre dans la voiture pour ne pas gêner", "Te lever pour regarder par-dessus le champ"],
      why: "C'est souvent possible d'être au bloc, selon la maternité et la situation. Ta place : près de sa tête, ta main, ta voix." },
    { q: "Le minuteur affiche une contraction « en cours » depuis 4 minutes.",
      a: ["Tu as sans doute oublié d'appuyer sur FIN : tu corriges", "C'est normal, tu laisses tourner", "Tu effaces tout et tu recommences"],
      why: "L'app te le propose d'elle-même. En revanche, une douleur vraiment continue, sans répit, est un signe qui doit faire appeler." },
    { q: "Vous êtes encore à la maison et elle sent que bébé arrive, maintenant.",
      a: ["Appeler le 15, haut-parleur, et ne pas prendre la route", "Foncer à la maternité", "Lui demander de se retenir jusqu'à l'arrivée"],
      why: "Le 15 te guide pas à pas et envoie une équipe. On ne prend pas la route quand la naissance est imminente." },
    { q: "Bébé vient de naître, la famille appelle sans arrêt.",
      a: ["Un seul message pour tous, et tu protèges le peau à peau", "Tu décroches à chacun pour tout raconter", "Tu lui passes le téléphone"],
      why: "Les deux premières heures sont à vous trois. Un message prêt à l'avance, et le téléphone retourne dans la poche." },
    { q: "En salle de naissance, tu sens que tu vas tomber : chaleur, vertige.",
      a: ["T'asseoir tout de suite, tête basse, et le dire", "Rester debout et serrer les dents", "Sortir vite sans rien dire à personne"],
      why: "Ça arrive, et ça n'a rien de honteux. Une fois assis{|e}, et l'équipe prévenue, ça passe ; debout, on tombe et l'équipe doit s'occuper de toi." }
  ],

  // ---------- Messages aux proches ----------
  messages: [
    { id: "depart", title: "🚗 On part à la maternité", text: "On part à la maternité ! Tout va bien, on vous donne des nouvelles dès qu'on peut. Pas besoin de répondre 🤍" },
    { id: "nouvelles", title: "⏳ Ça avance", text: "Petit point : le travail avance, tout va bien. On vous tient au courant. Merci pour vos pensées 🤍" },
    { id: "naissance", title: "👶 Bébé est né !", text: "{prenom} est né·e à {heure} ! {poids}{taille}{Maman et bébé vont bien|Tout le monde va bien}. On vous envoie des photos bientôt, laissez-nous un peu de calme pour faire connaissance 🤍" }
  ],

  disclaimer:
    "Cette application propose des informations générales pour aider le ou la partenaire à soutenir la personne qui accouche. Elle ne remplace pas l'avis d'une sage-femme ou d'un médecin. Suivez toujours les consignes de votre maternité et de l'équipe présente. En cas de doute ou de signe inhabituel, appelez votre maternité ou le 15."
};
