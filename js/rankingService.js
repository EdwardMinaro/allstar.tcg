(function(){
  const TRYOUT_MATCHES = 10;
  const HALL_OF_FAME_MIN_RANK = "champion_3";
  const HALL_OF_FAME_DAYS = 30;
  const HALL_OF_FAME_WEEKLY_MATCHES = 5;
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
    progress.currentRankId = progress.currentRankId || "";
    progress.hallOfFame = Boolean(progress.hallOfFame);
    progress.hallOfFameStartedAt = Math.max(0, Number(progress.hallOfFameStartedAt) || 0);
    progress.hallOfFameWeeks = progress.hallOfFameWeeks && typeof progress.hallOfFameWeeks === "object" ? progress.hallOfFameWeeks : {};
    progress.title = progress.title || "Rookie";
    progress.titles = Array.isArray(progress.titles) && progress.titles.length ? progress.titles : ["Rookie"];
    progress.careerXpWins = progress.careerXpWins && typeof progress.careerXpWins === "object" ? progress.careerXpWins : {};
    progress.levelRewards = progress.levelRewards && typeof progress.levelRewards === "object" ? progress.levelRewards : {};
    return progress;
  }

  function rankIndex(labelOrId){
    return RANKS.findIndex(rank=>rank.id === labelOrId || rank.label === labelOrId);
  }

  function rankFromId(id){
    return RANKS.find(rank=>rank.id===id)||null;
  }

  function rankForProgress(profile={}){
    const progress=normalizeProgress(profile);
    const calculated=rankForElo(progress.elo,progress.rankedMatches);
    if(calculated.id==="tryouts")return calculated;
    const protectedRank=rankFromId(progress.currentRankId);
    return protectedRank||calculated;
  }

  function isoWeekKey(timestamp){
    const date=new Date(timestamp);
    const day=(date.getUTCDay()+6)%7;
    date.setUTCDate(date.getUTCDate()-day+3);
    const firstThursday=new Date(Date.UTC(date.getUTCFullYear(),0,4));
    const week=1+Math.round(((date-firstThursday)/86400000-3+((firstThursday.getUTCDay()+6)%7))/7);
    return `${date.getUTCFullYear()}-${String(week).padStart(2,"0")}`;
  }

  function weekKeysBetween(start,end){
    const keys=[];
    const cursor=new Date(start);
    cursor.setUTCHours(12,0,0,0);
    while(cursor.getTime()<=end){
      const key=isoWeekKey(cursor.getTime());
      if(keys[keys.length-1]!==key)keys.push(key);
      cursor.setUTCDate(cursor.getUTCDate()+7);
    }
    const finalKey=isoWeekKey(end);
    if(keys[keys.length-1]!==finalKey)keys.push(finalKey);
    return keys;
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

  function sortLeaderboard(profiles=[]){
    return profiles
      .map(profile=>({...profile,...normalizeProgress(profile)}))
      .sort((a,b)=>Number(b.elo)-Number(a.elo)||Number(b.wins)-Number(a.wins)||String(a.pseudo||"").localeCompare(String(b.pseudo||""),"fr"));
  }

  function getCachedLeaderboard(){
    if(!window.AllstarProfileService?.getCachedPublicProfiles)return [];
    return sortLeaderboard(window.AllstarProfileService.getCachedPublicProfiles());
  }

  async function getLeaderboard(){
    if(!window.AllstarProfileService?.listPublicProfiles)return getCachedLeaderboard();
    return sortLeaderboard(await window.AllstarProfileService.listPublicProfiles());
  }

  async function updateEloAfterMatch(profile, match={}){
    const progress = normalizeProgress(profile);
    const now=Number(match.now)||Date.now();
    const before=rankForElo(progress.elo,progress.rankedMatches);
    const beforeIndex=rankIndex(before.id);
    const previousRankId=progress.currentRankId;
    const isFirstRankedMatch=progress.rankedMatches===0;
    const delta = eloDelta(progress.elo, match.opponentElo, Boolean(match.won), progress.rankedMatches);
    progress.elo = Math.max(0, progress.elo + delta);
    progress.rankedMatches += 1;
    const calculated=rankForElo(progress.elo,progress.rankedMatches);
    const calculatedIndex=rankIndex(calculated.id);
    const events=[];

    if(isFirstRankedMatch)events.push({type:"tryouts-start"});

    if(before.id==="tryouts"&&calculated.id!=="tryouts"){
      progress.currentRankId=calculated.id;
      progress.rankProtection=3;
      events.push({type:"tryouts-complete",rank:calculated.label});
    }else if(calculated.id!=="tryouts"){
      const current=rankFromId(progress.currentRankId)||before;
      const currentIndex=rankIndex(current.id);
      if(calculatedIndex>currentIndex){
        progress.currentRankId=calculated.id;
        progress.rankProtection=3;
        events.push({type:"promotion",rank:calculated.label});
      }else if(calculatedIndex<currentIndex){
        if(progress.rankProtection>0){
          progress.rankProtection-=1;
          events.push({type:"protection",rank:current.label,remaining:progress.rankProtection});
        }else{
          progress.currentRankId=calculated.id;
          events.push({type:"relegation",rank:calculated.label});
        }
      }else if(previousRankId&&beforeIndex<currentIndex&&calculatedIndex===currentIndex&&match.won){
        progress.rankProtection=3;
        events.push({type:"protection-reset",rank:current.label});
      }else if(!progress.currentRankId){
        progress.currentRankId=calculated.id;
      }
    }

    const visibleRank=rankForProgress(progress);
    if(rankIndex(visibleRank.id)>rankIndex(progress.bestRank))progress.bestRank=visibleRank.label;

    if(!progress.hallOfFame){
      const champion=rankIndex(calculated.id)>=rankIndex(HALL_OF_FAME_MIN_RANK);
      if(!champion){
        progress.hallOfFameStartedAt=0;
        progress.hallOfFameWeeks={};
      }else{
        if(!progress.hallOfFameStartedAt)progress.hallOfFameStartedAt=now;
        const week=isoWeekKey(now);
        progress.hallOfFameWeeks[week]=(Number(progress.hallOfFameWeeks[week])||0)+1;
        const requiredWeeks=weekKeysBetween(progress.hallOfFameStartedAt,now);
        const sustained=now-progress.hallOfFameStartedAt>=HALL_OF_FAME_DAYS*86400000;
        const activeEveryWeek=requiredWeeks.every(key=>Number(progress.hallOfFameWeeks[key])>=HALL_OF_FAME_WEEKLY_MATCHES);
        if(sustained&&activeEveryWeek){
          progress.hallOfFame=true;
          progress.titles=Array.from(new Set([...(progress.titles||["Rookie"]),"Hall of Famer"]));
          events.push({type:"hall-of-fame"});
        }
      }
    }
    return {progress,delta,events};
  }

  window.AllstarRankingService = {
    TRYOUT_MATCHES,
    RANKS,
    getLeaderboard,
    getCachedLeaderboard,
    updateEloAfterMatch,
    xpForNextLevel,
    normalizeProgress,
    rankForElo,
    rankForProgress,
    winrate,
    addXp,
    eloDelta
  };
})();
