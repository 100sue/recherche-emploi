(function () {
  // ---------- DONNÉES PERSISTANTES ----------
  const STORAGE_KEY = "jobDashboard_candidatures";
  let candidatures = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    {
      id: 1,
      entreprise: "TechCorp",
      poste: "Développeur Frontend",
      date: "2025-03-18",
      statut: "entretien",
    },
    {
      id: 2,
      entreprise: "FinancePlus",
      poste: "Analyste financier",
      date: "2025-03-15",
      statut: "en cours",
    },
    {
      id: 3,
      entreprise: "StartupXYZ",
      poste: "Product Owner",
      date: "2025-03-10",
      statut: "refus",
    },
    {
      id: 4,
      entreprise: "GroupeA",
      poste: "Chef de projet",
      date: "2025-03-05",
      statut: "entretien",
    },
    {
      id: 5,
      entreprise: "WebGenius",
      poste: "Développeur Fullstack",
      date: "2025-03-01",
      statut: "en cours",
    },
  ];

  // Éléments DOM stats
  const totalSpan = document.getElementById("totalCandidatures");
  const entretiensSpan = document.getElementById("totalEntretiens");
  const reponsesSpan = document.getElementById("totalReponses");
  const tauxReponseSpan = document.getElementById("tauxReponse");
  const tauxSuccesSpan = document.getElementById("tauxSucces");

  // Éléments liste
  const container = document.getElementById("candidaturesContainer");

  // Éléments formulaire
  const manualFormDiv = document.getElementById("manualForm");
  const showFormBtn = document.getElementById("showFormBtn");
  const importBtn = document.getElementById("importGmailBtn");
  const ajouterBtn = document.getElementById("ajouterCandidatureBtn");

  // Éléments objectifs
  const candidaturesSemaineSpan = document.getElementById(
    "candidaturesSemaine",
  );
  const objectifHebdoInput = document.getElementById("objectifHebdo");
  const progressBar = document.getElementById("progressBar");
  const prochainsEntretiensDiv = document.getElementById(
    "prochainsEntretiensList",
  );
  const delaiReponseDiv = document.getElementById("delaiReponse");

  // Éléments du bandeau
  const bannerTauxEmploi = document.getElementById("bannerTauxEmploi");
  const bannerTauxEntretien = document.getElementById("bannerTauxEntretien");
  const bannerOffresPostulees = document.getElementById(
    "bannerOffresPostulees",
  );
  const bannerEnCours = document.getElementById("bannerEnCours");
  const bannerTip = document.getElementById("bannerTip").querySelector("p");

  // Conteneur candidatures spontanées
  const spontaneContainer = document.getElementById("spontaneContainer");

  // Graphiques
  let chartCandidatures, chartOffres;
  const ctxCand = document.getElementById("chartCandidatures").getContext("2d");
  const ctxOffres = document.getElementById("chartOffres").getContext("2d");

  // ---------- PRELOADER AMÉLIORÉ ----------
  const preloader = document.getElementById("preloader");
  const dashboard = document.getElementById("dashboard");
  const progressBarPreloader = document.getElementById("preloaderProgress");

  // Fonction pour animer le preloader
  function animatePreloader() {
    // Animation de la barre de progression
    gsap.to(progressBarPreloader, {
      width: "100%",
      duration: 1.5,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to(preloader, {
          opacity: 0,
          duration: 0.8,
          onComplete: () => {
            preloader.style.visibility = "hidden";
            dashboard.style.opacity = 1;
            // Animations d'entrée du dashboard
            gsap.from(".profile-header", {
              duration: 0.8,
              y: -30,
              opacity: 0,
              ease: "power2.out",
            });
            gsap.from(".card", {
              duration: 0.6,
              opacity: 1,
              y: 30,
              stagger: 0.08,
              ease: "back.out(1.2)",
              delay: 0.3,
            });
          },
        });
      },
    });
  }

  // Si la page est déjà chargée, on lance l'animation, sinon on attend load
  if (document.readyState === "complete") {
    animatePreloader();
  } else {
    window.addEventListener("load", animatePreloader);
  }

  // ---------- THÈME ----------
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const icon = themeToggle.querySelector("i");
    if (document.body.classList.contains("light-theme")) {
      icon.className = "fas fa-sun";
      themeToggle.innerHTML = '<i class="fas fa-sun"></i> Thème';
    } else {
      icon.className = "fas fa-moon";
      themeToggle.innerHTML = '<i class="fas fa-moon"></i> Thème';
    }
  });

  // ---------- TOAST ----------
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // ---------- FONCTIONS UTILITAIRES ----------
  function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidatures));
  }

  function updateStats() {
    const total = candidatures.length;
    const entretiens = candidatures.filter(
      (c) => c.statut === "entretien",
    ).length;
    const reponses = candidatures.filter(
      (c) => c.statut === "entretien" || c.statut === "refus",
    ).length;
    const tauxRep = total ? Math.round((reponses / total) * 100) : 0;
    const succes = total ? Math.round((entretiens / total) * 100) : 0;

    totalSpan.textContent = total;
    entretiensSpan.textContent = entretiens;
    reponsesSpan.textContent = reponses;
    tauxReponseSpan.textContent = tauxRep;
    tauxSuccesSpan.textContent = succes;
  }

  function getLast7DaysCounts() {
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      last7Days.push(`${yyyy}-${mm}-${dd}`);
    }

    const counts = new Array(7).fill(0);
    candidatures.forEach((c) => {
      const idx = last7Days.indexOf(c.date);
      if (idx !== -1) counts[idx]++;
    });
    return counts;
  }

  function initChartCandidatures() {
    if (chartCandidatures) chartCandidatures.destroy();
    chartCandidatures = new Chart(ctxCand, {
      type: "bar",
      data: {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [
          {
            label: "Candidatures envoyées",
            data: [3, 5, 2, 6, 4, 1, 2],
            backgroundColor: "#38bdf8",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#334155" },
            ticks: { color: "#94a3b8" },
          },
          x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
        },
      },
    });
  }

  function initChartOffres() {
    if (chartOffres) chartOffres.destroy();
    chartOffres = new Chart(ctxOffres, {
      type: "line",
      data: {
        labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
        datasets: [
          {
            label: "Offres publiées",
            data: [12, 15, 10, 18, 22, 8, 14],
            borderColor: "#fbbf24",
            backgroundColor: "rgba(251, 191, 36, 0.1)",
            tension: 0.3,
            fill: true,
            pointBackgroundColor: "#fbbf24",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#334155" },
            ticks: { color: "#94a3b8" },
          },
          x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
        },
      },
    });
  }

  function renderCandidatures() {
    let html = "";
    const sorted = [...candidatures].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    sorted.forEach((c) => {
      let statusClass = "status-en-cours";
      if (c.statut === "entretien") statusClass = "status-entretien";
      if (c.statut === "refus") statusClass = "status-refus";
      html += `
                        <div class="candidature-item" data-id="${c.id}">
                            <div class="candidature-info">
                                <h4>${c.poste} · ${c.entreprise}</h4>
                                <p><span>${c.date}</span> <span class="status-badge ${statusClass}">${c.statut}</span></p>
                            </div>
                            <button class="delete-btn" onclick="supprimerCandidature(${c.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
    });
    container.innerHTML =
      html ||
      '<p style="color:var(--text-secondary); text-align:center; padding:20px;">Aucune candidature pour le moment.</p>';
  }

  window.supprimerCandidature = function (id) {
    if (confirm("Supprimer cette candidature ?")) {
      candidatures = candidatures.filter((c) => c.id !== id);
      saveToStorage();
      refreshAll();
      showToast("Candidature supprimée");
    }
  };

  function ajouterCandidature(entreprise, poste, date, statut) {
    const newId = candidatures.length
      ? Math.max(...candidatures.map((c) => c.id)) + 1
      : 1;
    candidatures.push({ id: newId, entreprise, poste, date, statut });
    saveToStorage();
    refreshAll();
    showToast("Candidature ajoutée");
  }

  function renderSpontane() {
    const suggestions = [
      {
        entreprise: "Microsoft",
        poste: "Développeur Fullstack",
        raison: "Recrute en ce moment",
      },
      {
        entreprise: "Airbus",
        poste: "Ingénieur logiciel",
        raison: "Basé à Toulouse",
      },
      {
        entreprise: "Ubisoft",
        poste: "Game Designer",
        raison: "Poste souvent pourvu en interne",
      },
    ];
    let html = "";
    suggestions.forEach((s, index) => {
      html += `
                        <div class="spontane-item">
                            <div>
                                <strong>${s.entreprise}</strong> · ${s.poste}
                                <p>${s.raison}</p>
                            </div>
                            <button onclick="marquerSpontaneEnvoye(${index})">✓ Envoyer</button>
                        </div>
                    `;
    });
    spontaneContainer.innerHTML = html;
  }

  window.marquerSpontaneEnvoye = function (index) {
    const suggestion = suggestions[index];
    ajouterCandidature(
      suggestion.entreprise,
      suggestion.poste,
      new Date().toISOString().split("T")[0],
      "en cours",
    );
    showToast(`Candidature envoyée à ${suggestion.entreprise}`);
  };

  const suggestions = [
    {
      entreprise: "Microsoft",
      poste: "Développeur Fullstack",
      raison: "Recrute en ce moment",
    },
    {
      entreprise: "Airbus",
      poste: "Ingénieur logiciel",
      raison: "Basé à Toulouse",
    },
    {
      entreprise: "Ubisoft",
      poste: "Game Designer",
      raison: "Poste souvent pourvu en interne",
    },
  ];

  function updateObjectifs() {
    const counts = getLast7DaysCounts();
    const totalSemaine = counts.reduce((a, b) => a + b, 0);
    candidaturesSemaineSpan.textContent = totalSemaine;

    const objectif = parseInt(objectifHebdoInput.value, 10) || 5;
    const pourcentage = Math.min(
      100,
      Math.round((totalSemaine / objectif) * 100),
    );
    progressBar.style.width = pourcentage + "%";

    const todayStr = new Date().toISOString().split("T")[0];
    const prochains = candidatures.filter(
      (c) => c.statut === "entretien" && c.date >= todayStr,
    );
    if (prochains.length === 0) {
      prochainsEntretiensDiv.innerHTML =
        '<p style="color:var(--text-secondary);">Aucun entretien à venir.</p>';
    } else {
      let html = "";
      prochains
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((c) => {
          html += `
                            <div class="entretien-item" data-id="${c.id}">
                                <div>
                                    <strong>${c.entreprise}</strong> - ${c.poste}
                                    <p>${c.date}</p>
                                </div>
                                <button onclick="marquerEntretienFait(${c.id})" title="Marquer comme fait"><i class="fas fa-check-circle"></i></button>
                            </div>
                        `;
        });
      prochainsEntretiensDiv.innerHTML = html;
    }

    const septJoursAvant = new Date();
    septJoursAvant.setDate(septJoursAvant.getDate() - 7);
    const limiteStr = septJoursAvant.toISOString().split("T")[0];
    const sansReponse = candidatures.filter(
      (c) => c.statut === "en cours" && c.date < limiteStr,
    ).length;
    delaiReponseDiv.innerHTML = `📬 ${sansReponse} candidature(s) sans réponse depuis plus de 7 jours.`;
  }

  window.marquerEntretienFait = function (id) {
    const index = candidatures.findIndex((c) => c.id === id);
    if (index !== -1) {
      candidatures[index].statut = "en cours";
      saveToStorage();
      refreshAll();
      showToast("Entretien marqué comme fait");
    }
  };

  function updateBanner() {
    const total = candidatures.length;
    const entretiens = candidatures.filter(
      (c) => c.statut === "entretien",
    ).length;
    const enCours = candidatures.filter((c) => c.statut === "en cours").length;
    const tauxEntretien = total ? Math.round((entretiens / total) * 100) : 0;
    const tauxEmploi = 68;
    bannerTauxEmploi.textContent = tauxEmploi + "%";
    bannerTauxEntretien.textContent = tauxEntretien + "%";
    bannerOffresPostulees.textContent = total;
    bannerEnCours.textContent = enCours;

    const tips = [
      "Relancez vos candidatures après une semaine",
      "Personnalisez votre CV pour chaque offre",
      "Activez les alertes sur les sites d'emploi",
      "Préparez 3 questions à poser en entretien",
      "Mettez à jour votre profil LinkedIn",
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    bannerTip.textContent = `💡 "${randomTip}"`;
  }

  // Carrousel de conseils dans le bandeau
  let tipIndex = 0;
  const bannerTipsList = [
    "Relancez vos candidatures après une semaine",
    "Personnalisez votre CV pour chaque offre",
    "Activez les alertes sur les sites d'emploi",
    "Préparez 3 questions à poser en entretien",
    "Mettez à jour votre profil LinkedIn",
  ];
  function rotateTip() {
    tipIndex = (tipIndex + 1) % bannerTipsList.length;
    bannerTip.textContent = `💡 "${bannerTipsList[tipIndex]}"`;
  }
  setInterval(rotateTip, 5000);

  function refreshAll() {
    renderCandidatures();
    updateStats();
    updateObjectifs();
    updateBanner();
    renderSpontane();
  }

  // ---------- EXPORT ----------
  window.exportData = function () {
    const data = candidatures
      .map((c) => `${c.date} - ${c.entreprise} - ${c.poste} - ${c.statut}`)
      .join("\n");
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidatures.txt";
    a.click();
    showToast("Export terminé");
  };

  // ---------- PRÉPARATION ENTRETIENS AMÉLIORÉE ----------
  window.toggleAnswer = function (id) {
    const item = document.getElementById("question" + id);
    item.classList.toggle("expanded");
  };
  window.simulateInterview = function () {
    alert(
      "Simulation d'entretien : Entretien avec un Avatar IA spécialisé RH. (Fonctionnalité premium)",
    );
  };

  // ---------- ÉVÉNEMENTS ----------
  showFormBtn.addEventListener("click", () => {
    manualFormDiv.style.display =
      manualFormDiv.style.display === "none" ? "block" : "none";
  });

  ajouterBtn.addEventListener("click", () => {
    const entreprise = document.getElementById("entrepriseInput").value.trim();
    const poste = document.getElementById("posteInput").value.trim();
    const date = document.getElementById("dateInput").value;
    const statut = document.getElementById("statutInput").value;

    if (!entreprise || !poste || !date) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    ajouterCandidature(entreprise, poste, date, statut);
    document.getElementById("entrepriseInput").value = "";
    document.getElementById("posteInput").value = "";
    document.getElementById("dateInput").value = "2025-03-25";
    document.getElementById("statutInput").value = "en cours";
    manualFormDiv.style.display = "none";
  });

  importBtn.addEventListener("click", () => {
    const fakeCandidatures = [
      {
        entreprise: "Amazon",
        poste: "Cloud Engineer",
        date: "2025-03-22",
        statut: "en cours",
      },
      {
        entreprise: "BNP Paribas",
        poste: "Data Analyst",
        date: "2025-03-21",
        statut: "en cours",
      },
      {
        entreprise: "Doctolib",
        poste: "Product Designer",
        date: "2025-03-20",
        statut: "entretien",
      },
    ];
    fakeCandidatures.forEach((f) => {
      const newId = candidatures.length
        ? Math.max(...candidatures.map((c) => c.id)) + 1
        : 1;
      candidatures.push({ id: newId, ...f });
    });
    saveToStorage();
    refreshAll();
    showToast("3 candidatures importées");
  });

  objectifHebdoInput.addEventListener("input", updateObjectifs);

  const tipItems = document.querySelectorAll(".tip-item");
  const conseilsListe = [
    "Personnalisez votre CV pour chaque candidature en reprenant les mots-clés de l'offre.",
    "Activez les alertes emploi sur les sites pour être le premier à postuler.",
    "Préparez 3 questions pertinentes à poser en entretien sur l'équipe ou la mission.",
    "Utilisez LinkedIn pour identifier le recruteur et envoyez-lui un message direct.",
    "Après un entretien, envoyez un email de remerciement dans les 2 heures.",
    "Créez un portfolio en ligne ou un site vitrine pour valoriser vos réalisations.",
    "Participez à des webinaires ou meetups pour rencontrer des professionnels.",
    "Demandez des recommandations à d'anciens collègues sur LinkedIn.",
    "Tenez un tableau de suivi de vos candidatures avec les dates de relance.",
    "Entraînez-vous aux entretiens simulés avec un ami ou devant un miroir.",
    "Mettez à jour votre profil LinkedIn avec vos dernières réalisations.",
    "Suivez les entreprises qui vous intéressent pour être informé des offres.",
    "Utilisez un outil de suivi du temps pour consacrer 2h par jour à la recherche.",
    "N'hésitez pas à relancer après une semaine sans réponse.",
    "Soignez votre présence en ligne : vos réseaux sociaux sont scrutés.",
    "Préparez une présentation éclair de 30 secondes sur vous.",
    "Identifiez vos compétences transférables pour postuler à des secteurs variés.",
    "Gardez une attitude positive et entourez-vous de personnes motivantes.",
    "Notez vos réussites pour renforcer votre confiance avant un entretien.",
    "Créez des alertes sur les sites des entreprises directement.",
    "Utilisez des applications de mise en relation professionnelle.",
    "Renseignez-vous sur les valeurs de l'entreprise avant l'entretien.",
    "Préparez des exemples concrets de vos réalisations avec la méthode STAR.",
    "Travaillez votre langage corporel lors des entretiens vidéo.",
    "Gardez un fichier avec les questions posées en entretien pour vous améliorer.",
    "Faites relire votre CV par un professionnel du secteur.",
    "Utilisez des mots-clés du secteur pour passer les ATS.",
    "N'oubliez pas de vérifier vos paramètres de confidentialité en ligne.",
    "Rejoignez des groupes LinkedIn liés à votre secteur.",
    "Fixez-vous des objectifs hebdomadaires réalistes.",
    "Célébrez chaque petite victoire pour rester motivé.",
  ];

  tipItems.forEach((item) => {
    item.addEventListener("click", function () {
      const p = this.querySelector("p");
      if (p) {
        const randomIndex = Math.floor(Math.random() * conseilsListe.length);
        p.textContent = conseilsListe[randomIndex];
      }
    });
  });

  // Initialisation
  initChartCandidatures();
  initChartOffres();
  refreshAll();
})();
