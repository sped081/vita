// Rapport final — Projet d'intégration 2 (420-AP2-MA), VIREXON Technologies, équipe 04
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, TableOfContents, Header, Footer, PageNumber, PositionalTab,
  PositionalTabAlignment, PositionalTabRelativeTo, PositionalTabLeader, Bookmark, InternalHyperlink, TabStopType, Tab,
} = require('docx');
const PAGES = process.argv[3] && fs.existsSync(process.argv[3]) ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
const HEADS = [];

const FONT = 'Calibri', MONO = 'Consolas';
const ACCENT = '1F4E79', LIGHT = 'DCE6F1', CODEBG = 'F2F2F2', FILL = 'FFF4CE';
const W = 9360; // largeur utile (Letter, marges 1 po)

const p = (text, o = {}) => new Paragraph({ spacing: { after: 120 }, ...o, children: [].concat(text).map((t) => typeof t === 'string' ? new TextRun(t) : t) });
const b = (t) => new TextRun({ text: t, bold: true });
const i = (t) => new TextRun({ text: t, italics: true });
const mk = (lvl, t) => { const id = 'h' + HEADS.length; HEADS.push({ id, lvl, t }); return new Bookmark({ id, children: [new TextRun(t)] }); };
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [mk(1, t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [mk(2, t)] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const bullet = (t) => new Paragraph({ numbering: { reference: 'puces', level: 0 }, spacing: { after: 60 }, children: [].concat(t).map((x) => typeof x === 'string' ? new TextRun(x) : x) });
const code = (lines) => lines.map((l, k) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: CODEBG, color: 'auto' },
  spacing: { after: k === lines.length - 1 ? 160 : 0, line: 260 },
  indent: { left: 120, right: 120 },
  border: k === 0 ? { top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF', space: 4 } } : undefined,
  children: [new TextRun({ text: l || ' ', font: MONO, size: 18 })],
}));
// Encadré jaune : ce que l'équipe doit compléter
const todo = (t) => new Paragraph({
  shading: { type: ShadingType.CLEAR, fill: FILL, color: 'auto' },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'BF9000', space: 6 } },
  spacing: { before: 60, after: 160 }, indent: { left: 120 },
  children: [new TextRun({ text: '[À compléter] ', bold: true, color: '7F6000' }), new TextRun({ text: t, color: '7F6000' })],
});
let figN = 0;
const capture = (what, proves) => {
  figN++;
  return [
    new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),
    new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: [W],
      rows: [new TableRow({ height: { value: 2600, rule: 'atLeast' }, children: [new TableCell({
        width: { size: W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'F7F9FC', color: 'auto' },
        borders: { top: dash, bottom: dash, left: dash, right: dash },
        verticalAlign: 'center',
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Insérer la capture ${figN} ici`, color: '808080', bold: true })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: what, color: '808080', size: 20 })] })],
      })] })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 60 }, children: [new TextRun({ text: `Figure ${figN} — ${what}`, italics: true, size: 20 })] }),
    new Paragraph({ spacing: { after: 200 }, children: [b('Commentaire : '), new TextRun(`cette capture montre ${proves}`)] }),
  ];
};
const dash = { style: BorderStyle.DASHED, size: 6, color: '8EA9C8' };

// Tableau simple : en-tête + lignes
const table = (cols, rows, widths) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: widths,
  rows: [cols, ...rows].map((r, ri) => new TableRow({ tableHeader: ri === 0, children: r.map((c, ci) => new TableCell({
    width: { size: widths[ci], type: WidthType.DXA },
    shading: ri === 0 ? { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' } : (ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F3F6FA', color: 'auto' } : undefined),
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: c, bold: ri === 0, color: ri === 0 ? 'FFFFFF' : undefined, size: 20 })] })],
  })) })),
});

// ---------- Une étape du rapport ----------
// {n, titre, objectif, manip:[], cmds:[], reponse, captures:[[quoi, prouve]], questions?}
function etape(e) {
  const out = [h2(`Étape ${e.n} — ${e.titre}`), p([b('Objectif : '), e.objectif])];
  out.push(h3('Manipulation réalisée'));
  e.manip.forEach((m) => out.push(bullet(m)));
  if (e.cmds) { out.push(h3('Commandes utilisées')); out.push(...code(e.cmds)); }
  out.push(h3('Réponse du système'));
  out.push(p(e.reponse));
  out.push(todo('Décrivez ce que votre système a réellement affiché (valeurs, messages) et tout écart par rapport à ce qui était attendu.'));
  e.captures.forEach(([w, pr]) => out.push(...capture(w, pr)));
  if (e.questions) {
    out.push(h3('Réponses aux questions'));
    e.questions.forEach((q) => { out.push(p([b('Q. '), q])); out.push(todo('Votre réponse.')); });
  }
  return out;
}

const DEMOS = [
  {
    titre: 'Démonstration 1 — Virtualisation, sauvegardes et réseau',
    intro: "Cette démonstration met en place le socle de l'infrastructure : l'hyperviseur, le serveur de sauvegarde, les modèles de machines virtuelles et le routeur pare-feu pfSense qui fournit le DHCP et le VPN.",
    etapes: [
      { titre: 'Inventaire matériel et câblage',
        objectif: "relever les caractéristiques des deux serveurs physiques confiés (07 et 08) et vérifier qu'ils supportent la virtualisation et la version de Proxmox choisie.",
        manip: ['Relevé du processeur, de la mémoire, du stockage et des cartes réseau de VIR-QC-PVE-01 (serveur 07) et VIR-QC-PBS-01 (serveur 08).', 'Vérification de la prise en charge de VT-x / AMD-V.', 'Fabrication des câbles CAT6 (norme T568B aux deux extrémités) et étiquetage selon la convention (ex. QC-R1-P01 → PVE01-NIC0).', 'Remplissage du document « Identification du matériel ».'],
        cmds: ['hostname; date', 'lscpu | grep -E "Model name|^CPU\\(s\\)|Thread|Virtualization"', 'free -h', 'lsblk -o NAME,SIZE,TYPE,MODEL', 'ip link show'],
        reponse: "Les commandes affichent le modèle de processeur, le nombre de cœurs et de fils, la présence des extensions de virtualisation, la mémoire totale, les disques et les adresses MAC de chaque carte réseau.",
        captures: [['Inventaire de VIR-QC-PVE-01 (lscpu, free, lsblk, ip link)', "que le serveur 07 dispose des extensions de virtualisation et des ressources nécessaires à Proxmox VE."], ['Inventaire de VIR-QC-PBS-01', 'les caractéristiques du serveur 08 destiné aux sauvegardes.']],
        tableau: true },
      { titre: 'Installation de Proxmox VE (VIR-QC-PVE-01)',
        objectif: "installer l'hyperviseur et séparer le réseau de gestion (vmbr0) du réseau des machines virtuelles (vmbr1).",
        manip: ["Installation de Proxmox VE depuis l'ISO sur clé USB.", 'Adresse de gestion 192.168.160.2/24, passerelle 192.168.160.1, DNS 192.168.160.10.', 'Création du pont vmbr1, sans adresse IP, réservé aux machines virtuelles.', "Accès à l'interface web https://192.168.160.2:8006 (compte root, PAM)."],
        cmds: ['pveversion', 'cat /etc/network/interfaces', 'ip -br addr', 'curl -k -s -o /dev/null -w "%{http_code}\\n" https://192.168.160.2:8006', 'grep -H net /etc/pve/qemu-server/*.conf'],
        reponse: "Le fichier /etc/network/interfaces montre vmbr0 avec l'adresse 192.168.160.2/24 et vmbr1 en mode manuel, sans adresse. L'interface web répond sur le port 8006 (code 200) et les cartes réseau des machines virtuelles sont reliées à vmbr1.",
        captures: [['Fichier /etc/network/interfaces', 'les deux ponts : vmbr0 pour la gestion, vmbr1 pour les machines virtuelles.'], ["Interface web : Nœud → System → Network", 'les ponts vus depuis la console de gestion.']] },
      { titre: 'Proxmox Backup Server (VIR-QC-PBS-01) et console unique',
        objectif: 'installer PBS, créer un datastore et le rattacher à Proxmox VE pour gérer les deux serveurs depuis la même interface.',
        manip: ["Installation de PBS depuis l'ISO, adresse 192.168.160.3/24.", 'Création du datastore sur un disque dédié (Administration → Datastore → Add).', "Ajout de PBS comme stockage dans Proxmox VE (Datacenter → Storage → Add → Proxmox Backup Server) avec l'empreinte du certificat."],
        cmds: ['# Sur PBS', 'proxmox-backup-manager versions', 'proxmox-backup-manager datastore list', 'proxmox-backup-manager cert info | grep Fingerprint', '', '# Sur PVE', 'pvesm status'],
        reponse: 'La commande pvesm status liste un stockage de type pbs dont le statut est « active » : Proxmox VE peut donc écrire ses sauvegardes sur PBS.',
        captures: [['pvesm status sur VIR-QC-PVE-01', 'que PBS est rattaché à Proxmox VE et actif.'], ['Datacenter → Storage', 'la console unique qui gère PVE et PBS.']] },
      { titre: 'Modèles de machines virtuelles et clones liés',
        objectif: 'créer trois modèles réutilisables et en dériver des clones liés pour économiser l\'espace disque.',
        manip: ['Création et préparation de TPL-DEB12 (Debian 12), TPL-WS2022 (Windows Server 2022) et TPL-WIN11 (Windows 11).', 'Généralisation des systèmes Windows (sysprep) avant la conversion.', 'Conversion en modèles, puis création de clones liés.'],
        cmds: ['qm template <VMID>', 'qm clone <TPLID> <NEWID> --name VIR-QC-DC-01 --full 0', 'qm list'],
        reponse: 'Les trois modèles apparaissent avec une icône de modèle dans l\'arborescence ; les clones liés démarrent en quelques secondes et n\'occupent que les différences sur le disque.',
        captures: [['qm list et arborescence des modèles', 'les trois modèles TPL-DEB12, TPL-WS2022 et TPL-WIN11 et les clones créés.']] },
      { titre: 'Script de création de machine virtuelle',
        objectif: 'automatiser la création d\'une VM (clone lié ou VM vierge) avec le script creer-vm.sh.',
        manip: ['Copie du script scripts/creer-vm.sh sur VIR-QC-PVE-01 et ajout du droit d\'exécution.', 'Exécution en répondant aux questions : ID, nom, CPU, RAM, disque, pont, clone ou vierge.'],
        cmds: ['chmod +x creer-vm.sh', './creer-vm.sh', 'qm list'],
        reponse: 'Le script pose ses questions, crée la VM demandée et celle-ci apparaît dans qm list.',
        captures: [['Exécution de creer-vm.sh', 'les réponses fournies au script et la création réussie.'], ['qm list après le script', 'la nouvelle VM dans la liste.']] },
      { titre: 'Sauvegardes planifiées',
        objectif: 'sauvegarder automatiquement les machines virtuelles chaque semaine sur PBS.',
        manip: ['Création de la tâche de sauvegarde : ≥ 2 VM Windows et ≥ 2 VM Linux, mode snapshot, compression zstd, rétention keep-last 4 / keep-weekly 4.', 'Création d\'une tâche de vérification (Verify Job) hebdomadaire sur PBS.', 'Sauvegarde manuelle de test.'],
        cmds: ['cat /etc/pve/jobs.cfg', 'vzdump <VMID> --storage <stockage_pbs> --mode snapshot', 'pvesm list <stockage_pbs>'],
        reponse: 'Le fichier jobs.cfg contient la tâche et son horaire ; la sauvegarde de test apparaît dans le datastore de PBS.',
        captures: [['Datacenter → Backup', 'la tâche planifiée, son horaire et les VM sélectionnées.'], ['PBS → Datastore → Content', 'les sauvegardes présentes sur PBS.']],
        questions: ["La grille parle de « fin de semaine » et le guide de « vendredi 22 h » : quel horaire a été retenu et pourquoi ?"] },
      { titre: 'pfSense : routeur et pare-feu (VIR-QC-FW-01)',
        objectif: 'installer le routeur pare-feu qui relie le réseau des machines virtuelles au réseau du laboratoire.',
        manip: ['VM pfSense : 2 vCPU, 2 Go, deux cartes réseau (WAN sur vmbr0, LAN sur vmbr1), créée sans modèle.', 'Assignation des interfaces WAN et LAN et adressage du LAN.', 'Règles de pare-feu : le LAN est autorisé vers les services nécessaires, tout le reste est bloqué (refus par défaut).'],
        cmds: ['# Console pfSense, option 8 (Shell)', 'pfctl -si | head -3', 'netstat -rn | head -15', 'ping -c 3 8.8.8.8'],
        reponse: 'pfctl indique « Status: Enabled » ; la table de routage contient une route par défaut vers la passerelle du laboratoire et pfSense joint Internet.',
        captures: [['Firewall → Rules (LAN et WAN)', 'les règles de filtrage en place.'], ['Console pfSense : pfctl -si', 'que le pare-feu est actif.']] },
      { titre: 'Service DHCP',
        objectif: 'distribuer automatiquement les adresses aux postes clients.',
        manip: ['Services → DHCP Server : plage 192.168.160.100 à 192.168.160.200, passerelle .1, DNS 10.70.160.10.', 'Test depuis une VM Windows sur vmbr1.'],
        cmds: ['ipconfig /release', 'ipconfig /renew', 'ipconfig /all', 'tracert 8.8.8.8', 'net config workstation'],
        reponse: "La VM obtient une adresse de la plage, le serveur DHCP indiqué est pfSense et tracert montre pfSense comme premier saut.",
        captures: [['ipconfig /all sur la VM Windows', 'une adresse obtenue par DHCP auprès de pfSense.'], ['Status → DHCP Leases', 'le bail attribué au poste.']] },
      { titre: 'VPN entre le siège et les succursales',
        objectif: 'relier les réseaux des succursales (MTL, SHE, TR) au siège par des tunnels chiffrés.',
        manip: ['VPN → OpenVPN (ou IPsec) : un tunnel site à site par succursale.', 'Plage 10.70.160.200 à .254 réservée aux tunnels.', 'Règles de pare-feu WAN et OpenVPN.'],
        cmds: ['# Depuis un poste distant, tunnel établi', 'ipconfig', 'ping <IP d\'une VM du siège>'],
        reponse: 'Le tunnel est à l\'état « up » dans Status → OpenVPN et les hôtes du siège répondent à travers le tunnel.',
        captures: [['Status → OpenVPN', 'les tunnels établis.'], ['Ping à travers le tunnel', 'que le trafic passe entre les sites.']] },
    ],
  },
  {
    titre: 'Démonstration 2 — Active Directory, GPO, partages et DNS',
    intro: "Cette démonstration met en place l'annuaire de l'entreprise, ses 200 comptes, les stratégies de groupe, les partages de fichiers et le service DNS.",
    etapes: [
      { titre: 'Contrôleur de domaine principal (VIR-QC-DC-01)',
        objectif: 'créer la forêt equipe4.lan sur un serveur Windows Server 2022.',
        manip: ['Clone de TPL-WS2022, adresse 10.70.160.10, nom VIR-QC-DC-01.', 'Installation des rôles AD DS et DNS, promotion en contrôleur de domaine d\'une nouvelle forêt.'],
        cmds: ['Install-WindowsFeature AD-Domain-Services,DNS -IncludeManagementTools', 'Install-ADDSForest -DomainName equipe4.lan -DomainNetbiosName EQUIPE4 -InstallDNS', 'Get-ADDomain | Format-List DNSRoot,NetBIOSName'],
        reponse: 'Get-ADDomain affiche le domaine equipe4.lan et le nom NetBIOS EQUIPE4.',
        captures: [['Get-ADDomain', 'que la forêt equipe4.lan est créée.']] },
      { titre: 'Contrôleurs en lecture seule des succursales (RODC)',
        objectif: 'placer dans chaque succursale un contrôleur de domaine en lecture seule.',
        manip: ['Jonction du serveur de la succursale au domaine.', 'Promotion en RODC dans le site correspondant (Montréal, Sherbrooke, Trois-Rivières).'],
        cmds: ['Install-ADDSDomainController -DomainName equipe4.lan -ReadOnlyReplica -SiteName Montreal -InstallDNS -Credential (Get-Credential)', 'Get-ADDomainController -Filter * | Format-Table Name,Site,IsReadOnly,IPv4Address', 'repadmin /replsummary'],
        reponse: 'La liste des contrôleurs montre le RWDC du siège et le ou les RODC avec IsReadOnly = True ; repadmin ne signale aucune erreur de réplication.',
        captures: [['Get-ADDomainController', 'le contrôleur principal et les RODC.'], ['repadmin /replsummary', 'que la réplication fonctionne.']] },
      { titre: 'Création des utilisateurs et des groupes',
        objectif: 'créer les 200 employés, une OU et un groupe par département avec le script fourni.',
        manip: ['Copie de Utilisateurs.csv sur le contrôleur de domaine.', 'Exécution du script Creer-Utilisateurs-AD.ps1.', 'Le groupe Informatique est ajouté aux administrateurs du domaine.'],
        cmds: ['.\\Creer-Utilisateurs-AD.ps1 -CsvPath .\\Utilisateurs.csv -Domain equipe4.lan', '(Get-ADUser -Filter *).Count', 'Get-ADOrganizationalUnit -Filter * | Format-Table Name', 'Get-ADGroupMember "Admins du domaine" | Format-Table Name'],
        reponse: 'Le décompte des comptes correspond au fichier CSV ; chaque département possède son OU et son groupe ; Informatique figure parmi les administrateurs du domaine.',
        captures: [['Sortie du script de création', 'la création des comptes sans erreur.'], ['Utilisateurs et ordinateurs Active Directory', 'les OU par département.'], ['Membres des administrateurs du domaine', 'que le département Informatique administre le domaine.']] },
      { titre: 'Stratégies de groupe (GPO)',
        objectif: 'appliquer les mises à jour Windows quotidiennes et monter automatiquement le lecteur S: en lecture seule.',
        manip: ['GPO 1 : Configuration ordinateur → Modèles d\'administration → Windows Update → installation automatique quotidienne.', 'GPO 2 : Configuration utilisateur → Préférences → Mappages de lecteurs → S: vers \\\\VIR-QC-NAS-01\\Logiciels, lecture seule.', 'Liaison des GPO aux OU concernées.'],
        cmds: ['Get-GPO -All | Format-Table DisplayName,GpoStatus', '# Sur le poste client', 'gpupdate /force', 'gpresult /r', 'net use'],
        reponse: 'gpresult /r liste les deux GPO appliquées ; le lecteur S: apparaît dans net use et refuse l\'écriture.',
        captures: [['Gestion des stratégies de groupe', 'les deux GPO et leurs liaisons.'], ['gpresult /r sur le poste', 'que les GPO sont appliquées.'], ['Tentative d\'écriture sur S:', 'que le lecteur est en lecture seule.']] },
      { titre: 'Partages et lecteurs réseau',
        objectif: 'offrir les partages Informatique et Marketing avec des permissions par groupe.',
        manip: ['Création des partages sur le serveur de fichiers, lecture/écriture pour le groupe du département.', 'Mappage des deux lecteurs sur la station Windows 11 du siège.'],
        cmds: ['Get-SmbShare', 'Get-SmbShareAccess -Name Informatique', 'icacls <chemin du partage>', '# Sur le poste', 'net use'],
        reponse: 'Les partages existent, chaque groupe a les droits prévus et les lecteurs sont montés sur le poste.',
        captures: [['Permissions du partage Informatique', 'les droits accordés aux groupes.'], ['Lecteurs mappés dans l\'Explorateur', 'les lecteurs Informatique et Marketing sur le poste.']] },
      { titre: 'Service DNS principal et secondaire',
        objectif: 'résoudre tous les noms de l\'entreprise, avec une zone secondaire BIND9 dans chaque site.',
        manip: ['Zone principale intégrée à AD sur VIR-QC-DC-01.', 'SOA : TTL de cache 60 min, Refresh 2 h, Retry 30 min.', 'Un enregistrement A pour chaque serveur, un MX réservé au futur serveur de courriel.', 'Zone secondaire (slave) BIND9 sur Debian dans chaque site.'],
        cmds: ['Get-DnsServerResourceRecord -ZoneName equipe4.lan -RRType SOA | Select -Expand RecordData', 'Get-DnsServerResourceRecord -ZoneName equipe4.lan | Format-Table HostName,RecordType,RecordData', '# Sur le DNS secondaire', 'systemctl status bind9 --no-pager | head -5', 'dig @localhost equipe4.lan SOA', '# Depuis un poste', 'nslookup vir-qc-dc-01.equipe4.lan', 'ping vir-qc-nas-01.equipe4.lan'],
        reponse: 'La zone contient les paramètres SOA demandés, les enregistrements A et MX ; le serveur secondaire répond avec le même numéro de série ; les hôtes sont joignables par leur nom.',
        captures: [['Enregistrement SOA de la zone', 'les délais TTL, Refresh et Retry exigés.'], ['Enregistrements A et MX', 'que tous les serveurs sont déclarés.'], ['dig sur le serveur secondaire', 'que la zone est répliquée.'], ['ping par nom d\'hôte', 'que les hôtes sont joignables par leur nom.']] },
      { titre: 'Poste de travail Windows 11 (VIR-QC-WS-01)',
        objectif: 'préparer un poste propre, joint au domaine, avec les logiciels demandés.',
        manip: ['Partitionnement : C: système (50 %) et D: données (50 %).', 'Installation des pilotes et de toutes les mises à jour, retrait des logiciels superflus.', 'Jonction au domaine equipe4.lan et ouverture de session avec un compte du domaine.', 'Installation d\'Office 365 (activé), de 7-Zip et d\'un navigateur.'],
        cmds: ['systeminfo | findstr /B /C:"Domain"', 'net config workstation', 'whoami', 'ipconfig /all'],
        reponse: 'Le poste est membre de equipe4.lan, la session est ouverte avec un compte du domaine et toutes les partitions et pilotes sont conformes.',
        captures: [['systeminfo et net config workstation', 'la jonction au domaine.'], ['Gestion des disques (C: et D:)', 'le partitionnement demandé.'], ['Gestionnaire de périphériques', 'que tous les pilotes sont installés.']] },
    ],
  },
  {
    titre: 'Démonstration 3 — Stockage TrueNAS',
    intro: 'Cette démonstration met en place le serveur de stockage redondant et ses partages NFS et SMB.',
    etapes: [
      { titre: 'Installation de TrueNAS (VIR-QC-NAS-01)',
        objectif: 'installer TrueNAS avec six disques virtuels.',
        manip: ['Installation de TrueNAS sur une VM dédiée (pas dans un conteneur).', 'Ajout de six disques virtuels.'],
        cmds: ['lsblk', 'zpool list'],
        reponse: 'Les six disques sont détectés par TrueNAS.',
        captures: [['Liste des disques dans TrueNAS', 'les six disques disponibles.']] },
      { titre: 'Volumes redondants : RAID 1, RAID 5 et LVM',
        objectif: 'créer au moins un volume en miroir et un volume RAIDZ1, avec LVM.',
        manip: ['Pool en miroir (RAID 1) sur deux disques.', 'Pool RAIDZ1 (équivalent RAID 5) sur trois disques ou plus.', 'Mise en place de LVM.'],
        cmds: ['zpool status', 'zpool list', 'pvs ; vgs ; lvs'],
        reponse: 'zpool status montre un vdev « mirror » et un vdev « raidz1 » à l\'état ONLINE ; les commandes LVM listent les volumes physiques, groupes et volumes logiques.',
        captures: [['zpool status', 'les deux pools redondants en ligne.'], ['Commandes LVM', 'la configuration LVM.']] },
      { titre: 'Partages NFS et SMB2',
        objectif: 'rendre les jeux de données accessibles aux clients Linux (NFS) et Windows (SMB).',
        manip: ['Création des partages NFS et SMB sur les jeux de données.', 'Tests depuis un client Linux, en utilisant les noms d\'hôtes.'],
        cmds: ['showmount -e vir-qc-nas-01.equipe4.lan', 'sudo mount -t nfs vir-qc-nas-01.equipe4.lan:/mnt/<pool>/<dataset> /mnt/test', 'df -h | grep nfs', 'smbclient -L //vir-qc-nas-01.equipe4.lan -U <utilisateur> -m SMB2'],
        reponse: 'L\'export NFS est listé et se monte ; smbclient liste les partages SMB.',
        captures: [['showmount et montage NFS', 'que le partage NFS est utilisable.'], ['smbclient -L', 'que les partages SMB sont accessibles.']] },
    ],
  },
  {
    titre: 'Démonstration 4 — NextCloud et supervision',
    intro: 'Cette démonstration déploie deux services en conteneurs : le partage de fichiers NextCloud et la supervision.',
    etapes: [
      { titre: 'NextCloud en conteneur (VIR-QC-NC-01)',
        objectif: 'offrir un service de fichiers aux employés du département Informatique.',
        manip: ['Installation de Docker et déploiement de NextCloud avec une base MariaDB (docker compose).', 'Création d\'un compte pour chaque employé du département Informatique.'],
        cmds: ['apt install docker.io docker-compose -y', 'docker compose up -d', 'docker ps', 'docker exec -u www-data <conteneur> php occ user:list'],
        reponse: 'Les conteneurs NextCloud et MariaDB sont « Up » et la liste des utilisateurs contient les comptes du département Informatique.',
        captures: [['docker ps', 'les conteneurs en fonctionnement.'], ['NextCloud → Utilisateurs', 'les comptes du département Informatique.']] },
      { titre: 'Service de supervision (VIR-QC-MON-01)',
        objectif: 'surveiller les serveurs avec un outil en conteneur.',
        manip: ['Déploiement de l\'outil choisi (Uptime Kuma, Zabbix ou Grafana + Prometheus) en conteneur.', 'Ajout des sondes pour les serveurs.'],
        cmds: ['docker run -d -p 3001:3001 -v uptime:/app/data --name uptime-kuma louislam/uptime-kuma:1', 'docker ps'],
        reponse: 'Le tableau de bord affiche l\'état de chaque serveur surveillé.',
        captures: [['Tableau de bord de supervision', 'les serveurs surveillés et leur état.']] },
      { titre: 'Gestion des conteneurs avec Dockhand',
        objectif: 'gérer les conteneurs de chaque hôte Docker depuis une interface.',
        manip: ['Installation de Dockhand sur chaque hôte Docker (NextCloud, supervision, Web).'],
        cmds: ['docker ps'],
        reponse: 'Dockhand liste les conteneurs de l\'hôte.',
        captures: [['Interface de Dockhand', 'la gestion des conteneurs.']] },
    ],
  },
  {
    titre: 'Démonstration 5 — Site Web, supervision et pare-feux',
    intro: 'Cette démonstration termine le projet avec l\'intranet sécurisé, la supervision complète, l\'automatisation et la sécurité des hôtes.',
    etapes: [
      { titre: 'Site Web sécurisé HTTPS (VIR-QC-WEB-01)',
        objectif: 'publier un intranet en HTTPS, accessible seulement depuis l\'interne et géré par l\'utilisateur tux.',
        manip: ['Conteneur nginx avec certificat TLS auto-signé.', 'Création de l\'utilisateur tux ; root reste propriétaire des répertoires.'],
        cmds: ['useradd -m tux', 'chown -R root:tux /var/www/intranet', 'chmod -R 750 /var/www/intranet', 'openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout intranet.key -out intranet.crt -subj "/CN=intranet.equipe4.lan"', 'ls -ld /var/www/intranet', 'curl -kI https://intranet.equipe4.lan'],
        reponse: 'Le site répond en HTTPS avec le certificat intranet.equipe4.lan ; les répertoires appartiennent à root avec le groupe tux.',
        captures: [['Permissions de /var/www/intranet et id tux', 'la séparation des droits root / tux.'], ['Site ouvert dans le navigateur', 'la connexion HTTPS.']] },
      { titre: 'Supervision d\'un serveur Windows et d\'un serveur Linux',
        objectif: 'surveiller au moins un serveur de chaque système avec les dépendances configurées.',
        manip: ['Ajout d\'un serveur Windows et d\'un serveur Linux à la supervision.', 'Configuration des dépendances (ex. un serveur dépend de pfSense).'],
        reponse: 'Les deux serveurs apparaissent « en ligne » et les dépendances sont définies.',
        captures: [['Tableau de bord : serveurs Windows et Linux', 'la supervision des deux systèmes.'], ['Configuration des dépendances', 'les liens de dépendance.']] },
      { titre: 'Pare-feux d\'hôtes',
        objectif: 'garder le pare-feu actif sur chaque serveur et poste.',
        manip: ['Vérification des trois profils du pare-feu Windows.', 'Activation et vérification du pare-feu sur les serveurs Linux.'],
        cmds: ['Get-NetFirewallProfile | Format-Table Name,Enabled', 'sudo ufw status verbose'],
        reponse: 'Les trois profils Windows sont à True et le pare-feu Linux est actif.',
        captures: [['Get-NetFirewallProfile', 'le pare-feu Windows actif.'], ['ufw status', 'le pare-feu Linux actif.']] },
      { titre: 'Automatisation avec Ansible (VIR-QC-ANS-01)',
        objectif: 'automatiser les mises à jour, l\'installation d\'outils et la collecte de métriques sur les serveurs Linux.',
        manip: ['Installation d\'Ansible et copie des clés SSH vers chaque cible.', 'Exécution des playbooks maj-linux.yml, install-outils.yml et metriques.yml.', 'Planification des mises à jour chaque soir avec cron.'],
        cmds: ['apt install ansible -y', 'ssh-copy-id ansible@<hôte>', 'ansible-playbook -i inventory.ini maj-linux.yml', 'crontab -l'],
        reponse: 'Le récapitulatif (PLAY RECAP) indique ok/changed sans échec pour chaque hôte et la tâche cron est planifiée.',
        captures: [['PLAY RECAP de maj-linux.yml', 'l\'exécution réussie sur les hôtes.'], ['crontab -l', 'la planification du soir.']] },
    ],
  },
];

// ---------- Contenu ----------
const children = [];
// Couverture
children.push(
  new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Projet d\'intégration 2', size: 28, color: '595959' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '420-AP2-MA', size: 24, color: '595959' })] }),
  new Paragraph({ spacing: { before: 600, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'RAPPORT FINAL', bold: true, size: 56, color: ACCENT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Infrastructure virtualisée de VIREXON Technologies', size: 32 })] }),
  new Paragraph({ spacing: { after: 900 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Équipe 04 — Automne 2026', size: 26, color: '595959' })] }),
);
const coverRows = [['Représentant de l\'équipe', '[Nom]'], ['Membres de l\'équipe', '[Nom 1], [Nom 2], [Nom 3], [Nom 4]'], ['Numéro d\'équipe', '04'], ['Enseignant', '[Nom de l\'enseignant]'], ['Date de remise', '[Date indiquée sur Léa]']];
children.push(new Table({ width: { size: 7200, type: WidthType.DXA }, columnWidths: [2800, 4400], alignment: AlignmentType.CENTER,
  rows: coverRows.map(([k, v]) => new TableRow({ children: [
    new TableCell({ width: { size: 2800, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: LIGHT, color: 'auto' }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [b(k)] })] }),
    new TableCell({ width: { size: 4400, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun(v)] })] }),
  ] })) }));
children.push(new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cégep — Techniques de l\'informatique', color: '808080' })] }));

// Table des matières
children.push(new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: 'Table des matières', bold: true, size: 32, color: ACCENT })] }));
const TOC_AT = children.length;

// Introduction
children.push(h1('1. Introduction'));
children.push(p("VIREXON Technologies est une PME dont le siège social est à Québec et qui compte trois succursales (Montréal, Sherbrooke et Trois-Rivières). Ses 200 employés sont répartis dans sept départements : Informatique, Marketing, Direction générale, Production, Ventes, Ressources humaines et Finances."));
children.push(p("Le mandat de l'équipe 04 était de concevoir et de mettre en place toute l'infrastructure informatique de l'entreprise, entièrement virtualisée sur Proxmox : virtualisation et sauvegardes, routage et sécurité, annuaire et DNS, stockage, services en conteneurs, site Web sécurisé, supervision et automatisation."));
children.push(p("Ce rapport présente chaque étape réalisée dans l'ordre des cinq démonstrations : la manipulation effectuée, la réponse du système et les captures d'écran commentées qui en font la preuve. Il se termine par la conclusion de chaque membre de l'équipe et par la webographie."));
children.push(todo('Ajoutez au besoin un paragraphe sur l\'organisation de l\'équipe (répartition des tâches, outils de suivi).'));

// Architecture
children.push(h1('2. Architecture et plan d\'adressage'));
children.push(h2('2.1 Serveurs physiques'));
children.push(table(['Serveur', 'Nom d\'hôte', 'Rôle', 'Adresse IP'], [['Serveur 07', 'VIR-QC-PVE-01', 'Hyperviseur Proxmox VE', '192.168.160.2/24'], ['Serveur 08', 'VIR-QC-PBS-01', 'Proxmox Backup Server', '192.168.160.3/24']], [1600, 2200, 3160, 2400]));
children.push(h2('2.2 Réseaux'));
children.push(table(['Réseau', 'Usage'], [['10.70.160.0/24', 'LAN Serveurs et infrastructure (vmbr1 des VM)'], ['192.168.160.0/24', 'Réseau clients et DMZ (DHCP pfSense .100 à .200 ; DMZ .128/25)'], ['10.70.161.0/24', 'Succursale de Montréal (planifiée)'], ['10.70.162.0/24', 'Succursale de Sherbrooke (planifiée)'], ['10.70.163.0/24', 'Succursale de Trois-Rivières (planifiée)'], ['10.70.160.200 – .254', 'Réservé aux tunnels VPN']], [3000, 6360]));
children.push(h2('2.3 Machines virtuelles et services'));
children.push(table(['Nom d\'hôte', 'Service', 'Adresse IP'], [['VIR-QC-FW-01', 'pfSense : routeur, pare-feu, DHCP, VPN', '[à compléter]'], ['VIR-QC-DC-01', 'Active Directory, DNS principal', '10.70.160.10'], ['VIR-QC-NAS-01', 'TrueNAS : stockage NFS / SMB', '[à compléter]'], ['VIR-QC-NC-01', 'NextCloud (conteneur)', '[à compléter]'], ['VIR-QC-MON-01', 'Supervision (conteneur)', '[à compléter]'], ['VIR-QC-WEB-01', 'Site Web HTTPS (conteneur)', '[à compléter]'], ['VIR-QC-ANS-01', 'Ansible', '[à compléter]'], ['VIR-QC-WS-01', 'Poste Windows 11', 'DHCP']], [2600, 4360, 2400]));
children.push(...capture('Schéma réseau de l\'infrastructure (siège et succursales)', 'l\'ensemble des équipements, des ponts vmbr0 / vmbr1, de pfSense et des tunnels VPN vers les succursales.'));

// Démos
let sec = 3, n = 0;
const DATES = ['28 septembre 2026', '30 septembre 2026', '6 octobre 2026', '8 octobre 2026', '9 octobre 2026'];
DEMOS.forEach((d, di) => {
  children.push(h1(`${sec}. ${d.titre}`));
  children.push(p([b('Date de la démonstration : '), DATES[di]]));
  children.push(p(d.intro));
  d.etapes.forEach((e) => {
    n++; children.push(...etape({ ...e, n }));
    if (e.tableau) {
      children.push(p(b('Tableau d\'identification du matériel')));
      children.push(table(['Composant', 'VIR-QC-PVE-01 (serveur 07)', 'VIR-QC-PBS-01 (serveur 08)'],
        [['Modèle / châssis', '', ''], ['Processeur (cœurs / fils)', '', ''], ['Virtualisation VT-x / AMD-V', '', ''], ['Mémoire (type, quantité, fréquence)', '', ''], ['Stockage (contrôleur, disques, RAID)', '', ''], ['Cartes réseau (nombre, débit, MAC)', '', ''], ['Alimentation', '', '']], [3160, 3100, 3100]));
      children.push(new Paragraph({ spacing: { after: 120 } }));
    }
  });
  sec++;
});

// Sécurité / synthèse
children.push(h1(`${sec}. Synthèse de la sécurité de l'infrastructure`)); sec++;
children.push(bullet('Tous les serveurs, sauf les routeurs, reposent sur des volumes redondants (RAID 1 ou RAID 5).'));
children.push(bullet('Le siège et les succursales sont reliés par des tunnels VPN pfSense.'));
children.push(bullet('Les pare-feux des postes et des serveurs sont activés en tout temps ; pfSense applique un refus par défaut.'));
children.push(bullet('Les VM sont sauvegardées chaque semaine sur PBS, avec vérification d\'intégrité et snapshots avant chaque modification importante.'));
children.push(bullet('Tous les éléments sont supervisés, avec leurs dépendances.'));
children.push(todo('Ajoutez les difficultés rencontrées et les solutions trouvées (une ou deux par service).'));

// Conclusions
children.push(h1(`${sec}. Conclusions`)); sec++;
children.push(p('Chaque membre de l\'équipe rédige sa propre conclusion : ce qu\'il a réalisé, ce qu\'il a appris, les difficultés rencontrées et ce qu\'il ferait autrement.'));
['[Nom 1]', '[Nom 2]', '[Nom 3]', '[Nom 4]'].forEach((m) => { children.push(h2(`Conclusion de ${m}`)); children.push(todo('Conclusion personnelle (au moins un paragraphe, rédigée par le membre lui-même).')); });

// Webographie
children.push(h1(`${sec}. Webographie`)); sec++;
[['Proxmox VE — Documentation officielle', 'https://pve.proxmox.com/wiki/Main_Page'], ['Proxmox Backup Server — Documentation', 'https://pbs.proxmox.com/docs/'], ['Netgate — Documentation pfSense', 'https://docs.netgate.com/pfsense/en/latest/'], ['Microsoft Learn — Active Directory Domain Services', 'https://learn.microsoft.com/windows-server/identity/ad-ds/'], ['TrueNAS — Documentation', 'https://www.truenas.com/docs/'], ['Ansible — Documentation', 'https://docs.ansible.com/'], ['NextCloud — Documentation', 'https://docs.nextcloud.com/'], ['Linux Professional Institute — Learning', 'https://learning.lpi.org']]
  .forEach(([t, u]) => children.push(bullet([new TextRun(t + ' . '), new TextRun({ text: u, color: '0563C1', underline: {} }), new TextRun(' (consulté le [date]).')])));
children.push(todo('Ajoutez toutes les autres pages consultées pendant le projet.'));

// Annexe
children.push(h1(`${sec}. Annexe — Scripts utilisés`));
children.push(p('Les scripts fournis et utilisés pendant le projet :'));
children.push(table(['Script', 'Langage', 'Exécuté sur', 'Rôle'], [['creer-vm.sh', 'Bash', 'VIR-QC-PVE-01', 'Création de VM (clone lié ou vierge)'], ['Creer-Utilisateurs-AD.ps1', 'PowerShell', 'VIR-QC-DC-01', 'OU, groupes et 200 utilisateurs'], ['maj-linux.yml', 'Ansible', 'VIR-QC-ANS-01', 'Mises à jour tous les soirs'], ['install-outils.yml', 'Ansible', 'VIR-QC-ANS-01', 'curl, tree, net-tools, dnsutils'], ['metriques.yml', 'Ansible', 'VIR-QC-ANS-01', 'Métriques CPU, RAM, stockage']], [2700, 1400, 2160, 3100]));
children.push(todo('Collez ici le code de chaque script, ou joignez-le en fichier séparé selon les consignes de l\'enseignant.'));

const toc = HEADS.map((hd) => new Paragraph({
  spacing: { before: hd.lvl === 1 ? 140 : 20, after: 20 }, indent: { left: hd.lvl === 1 ? 0 : 360 },
  tabStops: [{ type: TabStopType.RIGHT, position: W, leader: 'dot' }],
  children: [new InternalHyperlink({ anchor: hd.id, children: [
    new TextRun({ text: hd.t, bold: hd.lvl === 1, size: hd.lvl === 1 ? 22 : 20 }),
    new TextRun({ children: [new Tab(), String(PAGES[hd.t] || '00')], bold: hd.lvl === 1, size: hd.lvl === 1 ? 22 : 20 }),
  ] })],
}));
children.splice(TOC_AT, 0, ...toc);
fs.writeFileSync(__dirname + '/heads.json', JSON.stringify(HEADS.map((x) => x.t)));
const doc = new Document({
  creator: 'Équipe 04', title: 'Rapport final — Projet d\'intégration 2', description: 'Infrastructure virtualisée de VIREXON Technologies',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: ACCENT, font: FONT }, paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: '2E75B6', font: FONT }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1, keepNext: true } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '404040', font: FONT }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: { config: [{ reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }, titlePage: true },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF', space: 4 } }, children: [new TextRun({ text: 'VIREXON Technologies — Rapport final', size: 18, color: '808080' }), new TextRun({ children: [new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, relativeTo: PositionalTabRelativeTo.MARGIN, leader: PositionalTabLeader.NONE }), 'Équipe 04'], size: 18, color: '808080' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' sur ', PageNumber.TOTAL_PAGES], size: 18, color: '808080' })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(process.argv[2], buf); console.log('écrit', process.argv[2], 'figures', figN, 'étapes', n); });
