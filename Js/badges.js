const badges = [
    { id: 1, name: "🏅 Débutant", requirement: 1, description: "Premier cours complété" },
    { id: 2, name: "🔥 En feu", requirement: 7, description: "7 jours de suite sur la plateforme" },
    { id: 3, name: "🎓 Master", requirement: 20, description: "20 cours complétés" },
    { id: 4, name: "⚡ Quiz Master", requirement: 10, description: "10 quiz réussis" },
    { id: 5, name: "👥 Social", requirement: 5, description: "Rejoint 5 groupes d'étude" }
];

function checkAndAwardBadges(userId, stats) {
    const unlocked = JSON.parse(localStorage.getItem(`badges_${userId}`) || '[]');
    const newBadges = badges.filter(b => stats.coursesCompleted >= b.requirement && !unlocked.includes(b.id));
    
    if (newBadges.length > 0) {
        const allBadges = [...unlocked, ...newBadges.map(b => b.id)];
        localStorage.setItem(`badges_${userId}`, JSON.stringify(allBadges));
        showNotification(`🎉 Nouveau badge débloqué ! ${newBadges.map(b => b.name).join(', ')}`);
    }
}