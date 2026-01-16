
import { Team, Player, Fixture } from './types';
import { PLAYER_IMAGE_REGISTRY } from './player-images';

export const TEAMS: Team[] = [
  { 
    id: 'rm', 
    name: 'Real Madrid', 
    colors: 'from-[#FFFFFF] to-[#FEBE10] text-slate-900', 
    secondary: '#FEBE10', 
    logoText: 'RMA', 
    logo: 'https://tmssl.akamaized.net/images/wappen/head/418.png' 
  },
  { 
    id: 'mci', 
    name: 'Manchester City', 
    colors: 'from-[#6CABDD] to-[#1C2C5B] text-white', 
    secondary: '#6CABDD', 
    logoText: 'MCI', 
    logo: 'https://tmssl.akamaized.net/images/wappen/head/281.png' 
  },
  { 
    id: 'liv', 
    name: 'Liverpool', 
    colors: 'from-[#C8102E] to-[#00B2A9] text-white', 
    secondary: '#C8102E', 
    logoText: 'LIV', 
    logo: 'https://tmssl.akamaized.net/images/wappen/head/31.png' 
  },
  { 
    id: 'bar', 
    name: 'FC Barcelona', 
    colors: 'from-[#004170] to-[#A50044] text-white', 
    secondary: '#A50044', 
    logoText: 'FCB', 
    logo: 'https://tmssl.akamaized.net/images/wappen/head/131.png' 
  },
  { 
    id: 'bay', 
    name: 'Bayern Munich', 
    colors: 'from-[#DC052D] to-[#0066B2] text-white', 
    secondary: '#DC052D', 
    logoText: 'BAY', 
    logo: 'https://tmssl.akamaized.net/images/wappen/head/27.png' 
  },
  { 
    id: 'psg', 
    name: 'PSG', 
    colors: 'from-[#004170] to-[#DA291C] text-white', 
    secondary: '#DA291C', 
    logoText: 'PSG', 
    logo: 'https://tmssl.akamaized.net/images/wappen/head/583.png' 
  },
  { 
    id: 'ars', 
    name: 'Arsenal', 
    colors: 'from-[#EF0107] to-[#063672] text-white', 
    secondary: '#EF0107', 
    logoText: 'ARS', 
    logo: 'https://tmssl.akamaized.net/images/wappen/head/11.png' 
  },
  { 
    id: 'fra', 
    name: 'France', 
    colors: 'from-[#002395] to-[#FFFFFF] text-white', 
    secondary: '#ED2939', 
    logoText: 'FRA', 
    logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/43/Logo_%C3%89quipe_France_Football_2018.svg/langfr-250px-Logo_%C3%89quipe_France_Football_2018.svg.png' 
  },
];

const RAW_PLAYERS = [
  { name: 'Anas Bengamra', teamId: 'rm', group: 'A' },
  { name: 'Mohamed Taha Kebdani', teamId: 'rm', group: 'A' },
  { name: 'Karim Beniouri', teamId: 'rm', group: 'A' },
  { name: 'Kamal Lakhr', teamId: 'bay', group: 'A' },
  { name: 'Younes Jebbar', teamId: 'bar', group: 'B' },
  { name: 'Souhail Boukili', teamId: 'ars', group: 'B' },
  { name: 'Yanis Saidi', teamId: 'bay', group: 'B' },
  { name: 'Anas Nouimi', teamId: 'rm', group: 'B' },
  { name: 'Mohamed Karim Nachit', teamId: 'mci', group: 'C' },
  { name: 'Youssef Fadlaoui', teamId: 'mci', group: 'C' },
  { name: 'Elmehdi Mahassine', teamId: 'rm', group: 'C' },
  { name: 'Zakaria Belbaida', teamId: 'rm', group: 'C' },
  { name: 'Ilyass Saddik', teamId: 'bay', group: 'D' },
  { name: 'Anas Habchi', teamId: 'fra', group: 'D' },
  { name: 'Anas Hilmi', teamId: 'bay', group: 'D' },
  { name: 'Rida Zouaki', teamId: 'rm', group: 'D' },
  { name: 'Soufiane Belkasmi', teamId: 'rm', group: 'E' },
  { name: 'Mohamed Amine Chaabani', teamId: 'psg', group: 'E' },
  { name: 'Saad Belkacemi', teamId: 'bar', group: 'E' },
  { name: 'Aymane AMZID', teamId: 'psg', group: 'E' },
  { name: 'Ilyasse Mbarki', teamId: 'rm', group: 'E' },
  { name: 'Mohannad Briouel', teamId: 'liv', group: 'F' },
  { name: 'Nabil Lamkadem', teamId: 'rm', group: 'F' },
  { name: 'Amine Chbihi', teamId: 'rm', group: 'F' },
  { name: 'Hatim Essafi', teamId: 'bar', group: 'F' },
  { name: 'Youssef Lahrizi', teamId: 'rm', group: 'F' },
];

export const INITIAL_PLAYERS: Player[] = RAW_PLAYERS.map((p, i) => {
  const registeredImage = PLAYER_IMAGE_REGISTRY[p.name];
  const avatar = registeredImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`;
  
  return {
    id: i + 1,
    name: p.name,
    teamId: p.teamId,
    group: p.group,
    wins: 0,
    losses: 0,
    avatar
  };
});

// Automatically generate a set of fixtures between group members
export const PRE_SEEDED_FIXTURES: Fixture[] = (() => {
  const fixtures: Fixture[] = [];
  const groups = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // Start Monday, January 19, 2026 at 10:00 AM
  let currentDate = new Date(2026, 0, 19, 10, 0, 0); 
  let matchesToday = 0;

  groups.forEach((groupName) => {
    const groupMembers = INITIAL_PLAYERS.filter(p => p.group === groupName);
    for (let i = 0; i < groupMembers.length; i++) {
      for (let j = i + 1; j < groupMembers.length; j++) {
        fixtures.push({
          id: `seed-${groupName}-${i}-${j}`,
          p1Id: groupMembers[i].id,
          p2Id: groupMembers[j].id,
          status: 'scheduled',
          timestamp: currentDate.getTime()
        });

        matchesToday++;

        // Each day can have up to 4 matches
        if (matchesToday >= 4) {
          matchesToday = 0;
          currentDate.setDate(currentDate.getDate() + 1);
          
          // Skip weekends: if Saturday (6) or Sunday (0), move to next Monday
          while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          currentDate.setHours(10, 0, 0); // Reset to morning session for new day
        } else {
          currentDate.setHours(currentDate.getHours() + 2); // Spread matches by 2 hours
        }
      }
    }
  });

  // Return a randomized subset of 25 matches spread across the weekdays
  return fixtures.sort(() => Math.random() - 0.5).slice(0, 25);
})();
