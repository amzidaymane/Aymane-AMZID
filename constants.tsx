
import { Team, Player, Fixture } from './types';
import { PLAYER_IMAGE_REGISTRY } from './player-images';

export const TEAMS: Team[] = [
  { id: 'rm', name: 'Real Madrid', colors: 'from-[#FFFFFF] to-[#FEBE10] text-slate-900', secondary: '#FEBE10', logoText: 'RMA', logo: 'https://tmssl.akamaized.net/images/wappen/head/418.png' },
  { id: 'mci', name: 'Manchester City', colors: 'from-[#6CABDD] to-[#1C2C5B] text-white', secondary: '#6CABDD', logoText: 'MCI', logo: 'https://tmssl.akamaized.net/images/wappen/head/281.png' },
  { id: 'liv', name: 'Liverpool', colors: 'from-[#C8102E] to-[#00B2A9] text-white', secondary: '#C8102E', logoText: 'LIV', logo: 'https://tmssl.akamaized.net/images/wappen/head/31.png' },
  { id: 'bar', name: 'FC Barcelona', colors: 'from-[#004170] to-[#A50044] text-white', secondary: '#A50044', logoText: 'FCB', logo: 'https://tmssl.akamaized.net/images/wappen/head/131.png' },
  { id: 'bay', name: 'Bayern Munich', colors: 'from-[#DC052D] to-[#0066B2] text-white', secondary: '#DC052D', logoText: 'BAY', logo: 'https://tmssl.akamaized.net/images/wappen/head/27.png' },
  { id: 'psg', name: 'PSG', colors: 'from-[#004170] to-[#DA291C] text-white', secondary: '#DA291C', logoText: 'PSG', logo: 'https://tmssl.akamaized.net/images/wappen/head/583.png' },
  { id: 'ars', name: 'Arsenal', colors: 'from-[#EF0107] to-[#063672] text-white', secondary: '#EF0107', logoText: 'ARS', logo: 'https://tmssl.akamaized.net/images/wappen/head/11.png' },
  { id: 'fra', name: 'France', colors: 'from-[#002395] to-[#FFFFFF] text-white', secondary: '#ED2939', logoText: 'FRA', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/43/Logo_%C3%89quipe_France_Football_2018.svg/langfr-250px-Logo_%C3%89quipe_France_Football_2018.svg.png' },
];

const RAW_PLAYERS = [
  { name: 'Nabil Lamkadem', teamId: 'rm', group: 'A' },
  { name: 'Anas Hilmi', teamId: 'bay', group: 'A' },
  { name: 'Ilyasse Mbarki', teamId: 'rm', group: 'A' },
  { name: 'Mohamed Karim Nachit', teamId: 'mci', group: 'A' },
  { name: 'Rida Zouaki', teamId: 'rm', group: 'A' },
  { name: 'Younes Jebbar', teamId: 'bar', group: 'B' },
  { name: 'Anas Nouimi', teamId: 'rm', group: 'B' },
  { name: 'Aymane AMZID', teamId: 'psg', group: 'C' },
  { name: 'Amine Chbihi', teamId: 'rm', group: 'B' },
  { name: 'Yanis Saidi', teamId: 'bay', group: 'C' },
  { name: 'Youssef Lahrizi', teamId: 'rm', group: 'B' },
  { name: 'Anas Habchi', teamId: 'fra', group: 'C' },
  { name: 'Anas Bengamra', teamId: 'rm', group: 'C' },
  { name: 'Mohannad Briouel', teamId: 'liv', group: 'D' },
  { name: 'Wadia TAZI', teamId: 'rm', group: 'C' },
  { name: 'Mohamed Amine Chaabani', teamId: 'psg', group: 'D' },
  { name: 'Elmehdi Mahassine', teamId: 'rm', group: 'D' },
  { name: 'Saad Belkacemi', teamId: 'bar', group: 'D' },
  { name: 'Zakaria Belbaida', teamId: 'rm', group: 'E' },
  { name: 'Hatim Essafi', teamId: 'bar', group: 'E' },
  { name: 'Soufiane Belkasmi', teamId: 'rm', group: 'E' },
  { name: 'Ilyass Saddik', teamId: 'bay', group: 'E' },
  { name: 'Mohamed Taha Kebdani', teamId: 'rm', group: 'F' },
  { name: 'Youssef Fadlaoui', teamId: 'mci', group: 'F' },
  { name: 'Karim Beniouri', teamId: 'rm', group: 'B' },
  { name: 'Souhail Boukili', teamId: 'ars', group: 'F' },
  { name: 'Kamal Lakhr', teamId: 'bay', group: 'F' },
];

export const INITIAL_PLAYERS: Player[] = RAW_PLAYERS.map((p, i) => {
  const registeredImage = PLAYER_IMAGE_REGISTRY[p.name];
  const avatar = registeredImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`;
  return { id: i + 1, name: p.name, teamId: p.teamId, group: p.group, wins: 0, losses: 0, avatar };
});

export const PRE_SEEDED_FIXTURES: Fixture[] = (() => {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F'];
  const matchesByGroup: Record<string, {p1Id: number, p2Id: number, group: string}[]> = {};

  groups.forEach((g) => {
    matchesByGroup[g] = [];
    const members = INITIAL_PLAYERS.filter(p => p.group === g);
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        matchesByGroup[g].push({ p1Id: members[i].id, p2Id: members[j].id, group: g });
      }
    }
  });

  const finalFixtures: Fixture[] = [];
  let lastPlayerIds: number[] = [];

  const scheduleDailyMatches = (day: number, groupFilter: string[], dailyLimit: number) => {
    let matchesTodayCount = 0;
    let time = new Date(2026, 0, day, 10, 0, 0);

    for (const group of groupFilter) {
      const pool = matchesByGroup[group];
      if (!pool) continue;

      while (matchesTodayCount < dailyLimit && pool.length > 0) {
        let matchIndex = -1;
        for (let i = 0; i < pool.length; i++) {
          if (!lastPlayerIds.includes(pool[i].p1Id) && !lastPlayerIds.includes(pool[i].p2Id)) {
            matchIndex = i;
            break;
          }
        }
        if (matchIndex === -1) matchIndex = 0;

        const match = pool.splice(matchIndex, 1)[0];
        finalFixtures.push({
          id: `seed-${match.group}-${day}-${matchesTodayCount}`,
          p1Id: match.p1Id,
          p2Id: match.p2Id,
          status: 'scheduled',
          timestamp: time.getTime()
        });
        lastPlayerIds = [match.p1Id, match.p2Id];
        time = new Date(time.getTime() + 60 * 60000);
        matchesTodayCount++;
      }
    }
  };

  scheduleDailyMatches(19, ['C'], 10);
  scheduleDailyMatches(20, ['A'], 10);
  scheduleDailyMatches(21, ['B'], 10);
  scheduleDailyMatches(22, ['D'], 6);
  scheduleDailyMatches(23, ['E'], 6);
  scheduleDailyMatches(26, ['F'], 6);
  scheduleDailyMatches(27, ['A', 'B', 'C', 'D', 'E', 'F'], 6);

  return finalFixtures;
})();
