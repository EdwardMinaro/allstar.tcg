(function(){
  const TRYOUT_MATCHES = 10;
  const RANKS = [
    { id:"jobber", label:"Jobber", min:0 },
    { id:"lowcarder_2", label:"Lowcarder II", min:900 },
    { id:"lowcarder_1", label:"Lowcarder I", min:1000 },
    { id:"midcarder_2", label:"Midcarder II", min:1100 },
    { id:"midcarder_1", label:"Midcarder I", min:1200 },
    { id:"upper_midcarder_2", label:"Upper Midcarder II", min:1350 },
    { id:"upper_midcarder_1", label:"Upper Midcarder I", min:1500 },
    { id:"main_eventer_2", label:"Main-Eventer II", min:1650 },
    { id:"main_eventer_1", label:"Main-Eventer I", min:1800 },
    { id:"champion_3", label:"Champion III", min:2000 },
    { id:"champion_2", label:"Champion II", min:2200 },
    { id:"champion_1", label:"Champion I", min:2400 }
  ];

  function xpForNextLevel(level){
    const safeLevel = Math.max(1, Number(level) || 1);
    return 100 + 50 * (safeLevel - 1);
  }

  function rankForElo(elo=1000, rankedMatches=0){
    const played = Math.max(0, Number(rankedMatches) || 0);
    if(played < TRYOUT_MATCHES){
      return {
        id:"tryouts",
        label:"Try-outs",
        min:null,
        nextAt:TRYOUT_MATCHES,
        remaining:TRYOUT_MATCHES - played
      };
    }
    const value = Number(elo) || 1000;
    let rank = RANKS[0];
    for(const candidate of RANKS){
      if(value >= candidate.min)rank = candidate;
    }
    return {...rank};
  }

  function normalizeProgress(profile={}){
    const progress = {...profile};
    progress.level = Math.max(1, Number(progress.level) || 1);
    progress.xp = Math.max(0, Number(progress.xp) || 0);
    progress.totalXp = Math.max(0, Number(progress.totalXp) || 0);
    progress.elo = Math.round(Number(progress.elo) || 1000);
    progress.wins = Math.max(0, Number(progress.wins) || 0);
    progress.losses = Math.max(0, Number(progress.losses) || 0);
    progress.rankedMatches = Math.max(0, Number(progress.rankedMatches) || 0);
    progress.rankProtection = Math.max(0, Math.min(3, Number(progress.rankProtection) || 0));
    progress.currentStreak = Number(progress.currentStreak) || 0;
    progress.bestStreak = Math.max(0, Number(progress.bestStreak) || 0);
    progress.bestRank = progress.bestRank || rankForElo(progress.elo, progress.rankedMatches).label;
    progress.hallOfFame = Boolean(progress.hallOfFame);
    progress.title = progress.title || "Rookie";
    progress.titles = Array.isArray(progress.titles) && progress.titles.length ? progress.titles : ["Rookie"];
    progress.careerXpWins = progress.careerXpWins && typeof progress.careerXpWins === "object" ? progress.careerXpWins : {};
    return progress;
  }

  function rankIndex(labelOrId){
    return RANKS.findIndex(rank=>rank.id === labelOrId || rank.label === labelOrId);
  }

  function winrate(wins=0, losses=0){
    const total = Number(wins || 0) + Number(losses || 0);
    if(!total)return "0,0 %";
    return `${((Number(wins || 0) / total) * 100).toFixed(1).replace(".", ",")} %`;
  }

  function addXp(profile, amount){
    const progress = normalizeProgress(profile);
    let remaining = Math.max(0, Number(amount) || 0);
    progress.totalXp += remaining;
    while(remaining > 0){
      const needed = xpForNextLevel(progress.level);
      const room = needed - progress.xp;
      if(remaining < room){
        progress.xp += remaining;
        remaining = 0;
      }else{
        remaining -= room;
        progress.level += 1;
        progress.xp = 0;
      }
    }
    return progress;
  }

  function eloDelta(playerElo=1000, opponentElo=1000, won=false, rankedMatches=0){
    const k = Number(rankedMatches) < TRYOUT_MATCHES ? 48 : 32;
    const expected = 1 / (1 + Math.pow(10, ((Number(opponentElo) || 1000) - (Number(playerElo) || 1000)) / 400));
    return Math.round(k * ((won ? 1 : 0) - expected));
  }

  async function getLeaderboard(){
    if(!window.AllstarProfileService?.listPublicProfiles)return [];
    const profiles=await window.AllstarProfileService.listPublicProfiles();
    return profiles
      .map(profile=>({...profile,...normalizeProgress(profile)}))
      .sort((a,b)=>Number(b.elo)-Number(a.elo)||Number(b.wins)-Number(a.wins)||String(a.pseudo||"").localeCompare(String(b.pseudo||""),"fr"));
  }

  async function updateEloAfterMatch(profile, match={}){
    const progress = normalizeProgress(profile);
    const delta = eloDelta(progress.elo, match.opponentElo, Boolean(match.won), progress.rankedMatches);
    progress.elo = Math.max(0, progress.elo + delta);
    progress.rankedMatches += 1;
    const rank = rankForElo(progress.elo, progress.rankedMatches);
    if(rankIndex(rank.label) > rankIndex(progress.bestRank))progress.bestRank = rank.label;
    return {...progress, lastEloDelta:delta};
  }

  window.AllstarRankingService = {
    TRYOUT_MATCHES,
    RANKS,
    getLeaderboard,
    updateEloAfterMatch,
    xpForNextLevel,
    normalizeProgress,
    rankForElo,
    winrate,
    addXp,
    eloDelta
  };
})();
