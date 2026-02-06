export interface QuestionAnswer {
  text: string;
  rank: number;
  points: number;
  normalized?: string; // Pre-normalized for better matching
  aliases?: string[]; // Alternative spellings/names
}

export interface GameQuestion {
  id: string;
  category: string;
  title: string;
  answers: QuestionAnswer[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export const sampleQuestions: GameQuestion[] = [
  // Sports Category
  {
    id: 'sports-1',
    category: 'Sports',
    title: 'Top 10 highest paid athletes',
    difficulty: 'medium',
    answers: [
      { text: 'Cristiano Ronaldo', rank: 1, points: 1, normalized: 'cristiano ronaldo', aliases: ['ronaldo', 'cr7'] },
      { text: 'Jon Rahm', rank: 2, points: 2, normalized: 'jon rahm', aliases: ['rahm'] },
      { text: 'Lionel Messi', rank: 3, points: 3, normalized: 'lionel messi', aliases: ['messi'] },
      { text: 'LeBron James', rank: 4, points: 4, normalized: 'lebron james', aliases: ['lebron', 'king james'] },
      { text: 'Giannis Antetokounmpo', rank: 5, points: 5, normalized: 'giannis antetokounmpo', aliases: ['giannis', 'greek freak'] },
      { text: 'Kylian Mbappé', rank: 6, points: 6, normalized: 'kylian mbappe', aliases: ['mbappe', 'mbappé'] },
      { text: 'Neymar', rank: 7, points: 7, normalized: 'neymar', aliases: ['neymar jr'] },
      { text: 'Karim Benzema', rank: 8, points: 8, normalized: 'karim benzema', aliases: ['benzema'] },
      { text: 'Stephen Curry', rank: 9, points: 9, normalized: 'stephen curry', aliases: ['curry', 'steph'] },
      { text: 'Lamar Jackson', rank: 10, points: 10, normalized: 'lamar jackson', aliases: ['jackson'] }
    ]
  },
  {
    id: 'sports-2',
    category: 'Sports',
    title: 'Top 10 most popular sports in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Soccer/Football', rank: 1, points: 1, normalized: 'soccer', aliases: ['football', 'soccer', 'futbol'] },
      { text: 'Cricket', rank: 2, points: 2, normalized: 'cricket' },
      { text: 'Basketball', rank: 3, points: 3, normalized: 'basketball' },
      { text: 'Hockey', rank: 4, points: 4, normalized: 'hockey', aliases: ['field hockey', 'ice hockey'] },
      { text: 'Tennis', rank: 5, points: 5, normalized: 'tennis' },
      { text: 'Volleyball', rank: 6, points: 6, normalized: 'volleyball' },
      { text: 'Table Tennis', rank: 7, points: 7, normalized: 'table tennis', aliases: ['ping pong'] },
      { text: 'American Football', rank: 8, points: 8, normalized: 'american football', aliases: ['nfl', 'gridiron'] },
      { text: 'Baseball', rank: 9, points: 9, normalized: 'baseball' },
      { text: 'Golf', rank: 10, points: 10, normalized: 'golf' }
    ]
  },
  {
    id: 'sports-3',
    category: 'Sports',
    title: 'Top 10 Olympic medal winning countries (all-time)',
    difficulty: 'hard',
    answers: [
      { text: 'United States', rank: 1, points: 1, normalized: 'united states', aliases: ['usa', 'us', 'america'] },
      { text: 'Soviet Union', rank: 2, points: 2, normalized: 'soviet union', aliases: ['ussr'] },
      { text: 'Germany', rank: 3, points: 3, normalized: 'germany' },
      { text: 'Great Britain', rank: 4, points: 4, normalized: 'great britain', aliases: ['uk', 'britain', 'united kingdom'] },
      { text: 'France', rank: 5, points: 5, normalized: 'france' },
      { text: 'Italy', rank: 6, points: 6, normalized: 'italy' },
      { text: 'China', rank: 7, points: 7, normalized: 'china' },
      { text: 'Australia', rank: 8, points: 8, normalized: 'australia' },
      { text: 'Sweden', rank: 9, points: 9, normalized: 'sweden' },
      { text: 'Hungary', rank: 10, points: 10, normalized: 'hungary' }
    ]
  },
  {
    id: 'sports-4',
    category: 'Sports',
    title: 'Top 10 FIFA World Cup winning nations',
    difficulty: 'medium',
    answers: [
      { text: 'Brazil', rank: 1, points: 1, normalized: 'brazil', aliases: ['brasil'] },
      { text: 'Germany', rank: 2, points: 2, normalized: 'germany' },
      { text: 'Italy', rank: 3, points: 3, normalized: 'italy' },
      { text: 'Argentina', rank: 4, points: 4, normalized: 'argentina' },
      { text: 'France', rank: 5, points: 5, normalized: 'france' },
      { text: 'Uruguay', rank: 6, points: 6, normalized: 'uruguay' },
      { text: 'England', rank: 7, points: 7, normalized: 'england' },
      { text: 'Spain', rank: 8, points: 8, normalized: 'spain' },
      { text: 'Netherlands', rank: 9, points: 9, normalized: 'netherlands', aliases: ['holland'] },
      { text: 'Croatia', rank: 10, points: 10, normalized: 'croatia' }
    ]
  },
  {
    id: 'sports-5',
    category: 'Sports',
    title: 'Top 10 all-time FIFA World Cup goal scorers',
    difficulty: 'hard',
    answers: [
      { text: 'Miroslav Klose', rank: 1, points: 1, normalized: 'miroslav klose', aliases: ['klose'] },
      { text: 'Ronaldo Nazário', rank: 2, points: 2, normalized: 'ronaldo nazario', aliases: ['ronaldo', 'r9', 'ronaldo nazário'] },
      { text: 'Gerd Müller', rank: 3, points: 3, normalized: 'gerd muller', aliases: ['gerd müller', 'muller'] },
      { text: 'Just Fontaine', rank: 4, points: 4, normalized: 'just fontaine', aliases: ['fontaine'] },
      { text: 'Lionel Messi', rank: 5, points: 5, normalized: 'lionel messi', aliases: ['messi'] },
      { text: 'Kylian Mbappé', rank: 6, points: 6, normalized: 'kylian mbappe', aliases: ['mbappe', 'mbappé'] },
      { text: 'Pelé', rank: 7, points: 7, normalized: 'pele', aliases: ['pelé'] },
      { text: 'Diego Maradona', rank: 8, points: 8, normalized: 'diego maradona', aliases: ['maradona'] },
      { text: 'Sándor Kocsis', rank: 9, points: 9, normalized: 'sandor kocsis', aliases: ['sándor kocsis', 'kocsis'] },
      { text: 'Gary Lineker', rank: 10, points: 10, normalized: 'gary lineker', aliases: ['lineker'] }
    ]
  },
  {
    id: 'sports-6',
    category: 'Sports',
    title: 'Top 10 countries by World Cup appearances',
    difficulty: 'medium',
    answers: [
      { text: 'Brazil', rank: 1, points: 1, normalized: 'brazil', aliases: ['brasil'] },
      { text: 'Germany', rank: 2, points: 2, normalized: 'germany' },
      { text: 'Italy', rank: 3, points: 3, normalized: 'italy' },
      { text: 'Argentina', rank: 4, points: 4, normalized: 'argentina' },
      { text: 'Mexico', rank: 5, points: 5, normalized: 'mexico' },
      { text: 'France', rank: 6, points: 6, normalized: 'france' },
      { text: 'England', rank: 7, points: 7, normalized: 'england' },
      { text: 'Spain', rank: 8, points: 8, normalized: 'spain' },
      { text: 'Uruguay', rank: 9, points: 9, normalized: 'uruguay' },
      { text: 'Netherlands', rank: 10, points: 10, normalized: 'netherlands', aliases: ['holland'] }
    ]
  },
  {
    id: 'sports-7',
    category: 'Sports',
    title: 'Top 10 UEFA Champions League title winners (clubs)',
    difficulty: 'hard',
    answers: [
      { text: 'Real Madrid', rank: 1, points: 1, normalized: 'real madrid', aliases: ['madrid'] },
      { text: 'AC Milan', rank: 2, points: 2, normalized: 'ac milan', aliases: ['milan'] },
      { text: 'Bayern Munich', rank: 3, points: 3, normalized: 'bayern munich', aliases: ['bayern', 'bayern münchen'] },
      { text: 'Liverpool', rank: 4, points: 4, normalized: 'liverpool' },
      { text: 'Barcelona', rank: 5, points: 5, normalized: 'barcelona', aliases: ['barca', 'barça'] },
      { text: 'Ajax', rank: 6, points: 6, normalized: 'ajax' },
      { text: 'Inter Milan', rank: 7, points: 7, normalized: 'inter milan', aliases: ['inter', 'internazionale'] },
      { text: 'Manchester United', rank: 8, points: 8, normalized: 'manchester united', aliases: ['man utd', 'man united'] },
      { text: 'Juventus', rank: 9, points: 9, normalized: 'juventus', aliases: ['juve'] },
      { text: 'Benfica', rank: 10, points: 10, normalized: 'benfica' }
    ]
  },
  {
    id: 'sports-8',
    category: 'Sports',
    title: 'Top 10 all-time UEFA Champions League top scorers',
    difficulty: 'hard',
    answers: [
      { text: 'Cristiano Ronaldo', rank: 1, points: 1, normalized: 'cristiano ronaldo', aliases: ['ronaldo', 'cr7'] },
      { text: 'Lionel Messi', rank: 2, points: 2, normalized: 'lionel messi', aliases: ['messi'] },
      { text: 'Robert Lewandowski', rank: 3, points: 3, normalized: 'robert lewandowski', aliases: ['lewandowski', 'lewy'] },
      { text: 'Karim Benzema', rank: 4, points: 4, normalized: 'karim benzema', aliases: ['benzema'] },
      { text: 'Raúl', rank: 5, points: 5, normalized: 'raul', aliases: ['raúl', 'raul gonzalez'] },
      { text: 'Ruud van Nistelrooy', rank: 6, points: 6, normalized: 'ruud van nistelrooy', aliases: ['van nistelrooy'] },
      { text: 'Thomas Müller', rank: 7, points: 7, normalized: 'thomas muller', aliases: ['thomas müller', 'muller', 'müller'] },
      { text: 'Thierry Henry', rank: 8, points: 8, normalized: 'thierry henry', aliases: ['henry'] },
      { text: 'Kylian Mbappé', rank: 9, points: 9, normalized: 'kylian mbappe', aliases: ['mbappe', 'mbappé'] },
      { text: 'Andriy Shevchenko', rank: 10, points: 10, normalized: 'andriy shevchenko', aliases: ['shevchenko', 'sheva'] }
    ]
  },
  {
    id: 'sports-9',
    category: 'Sports',
    title: 'Top 10 international men\'s football goal scorers',
    difficulty: 'hard',
    answers: [
      { text: 'Cristiano Ronaldo', rank: 1, points: 1, normalized: 'cristiano ronaldo', aliases: ['ronaldo', 'cr7'] },
      { text: 'Lionel Messi', rank: 2, points: 2, normalized: 'lionel messi', aliases: ['messi'] },
      { text: 'Ali Daei', rank: 3, points: 3, normalized: 'ali daei', aliases: ['daei'] },
      { text: 'Sunil Chhetri', rank: 4, points: 4, normalized: 'sunil chhetri', aliases: ['chhetri'] },
      { text: 'Mokhtar Dahari', rank: 5, points: 5, normalized: 'mokhtar dahari', aliases: ['dahari'] },
      { text: 'Ferenc Puskás', rank: 6, points: 6, normalized: 'ferenc puskas', aliases: ['puskás', 'puskas'] },
      { text: 'Romelu Lukaku', rank: 7, points: 7, normalized: 'romelu lukaku', aliases: ['lukaku'] },
      { text: 'Robert Lewandowski', rank: 8, points: 8, normalized: 'robert lewandowski', aliases: ['lewandowski', 'lewy'] },
      { text: 'Neymar', rank: 9, points: 9, normalized: 'neymar', aliases: ['neymar jr'] },
      { text: 'Hussein Saeed', rank: 10, points: 10, normalized: 'hussein saeed', aliases: ['saeed'] }
    ]
  },
  {
    id: 'sports-10',
    category: 'Sports',
    title: 'Top 10 Africa Cup of Nations winning nations',
    difficulty: 'hard',
    answers: [
      { text: 'Egypt', rank: 1, points: 1, normalized: 'egypt' },
      { text: 'Cameroon', rank: 2, points: 2, normalized: 'cameroon' },
      { text: 'Ghana', rank: 3, points: 3, normalized: 'ghana' },
      { text: 'Nigeria', rank: 4, points: 4, normalized: 'nigeria' },
      { text: 'Ivory Coast', rank: 5, points: 5, normalized: 'ivory coast', aliases: ['cote d\'ivoire', 'côte d\'ivoire'] },
      { text: 'Algeria', rank: 6, points: 6, normalized: 'algeria' },
      { text: 'DR Congo', rank: 7, points: 7, normalized: 'dr congo', aliases: ['congo', 'democratic republic of congo'] },
      { text: 'Zambia', rank: 8, points: 8, normalized: 'zambia' },
      { text: 'Tunisia', rank: 9, points: 9, normalized: 'tunisia' },
      { text: 'Morocco', rank: 10, points: 10, normalized: 'morocco' }
    ]
  },
  {
    id: 'sports-11',
    category: 'Sports',
    title: 'Top 10 Premier League all-time goal scorers',
    difficulty: 'hard',
    answers: [
      { text: 'Alan Shearer', rank: 1, points: 1, normalized: 'alan shearer', aliases: ['shearer'] },
      { text: 'Harry Kane', rank: 2, points: 2, normalized: 'harry kane', aliases: ['kane'] },
      { text: 'Wayne Rooney', rank: 3, points: 3, normalized: 'wayne rooney', aliases: ['rooney'] },
      { text: 'Andy Cole', rank: 4, points: 4, normalized: 'andy cole', aliases: ['cole', 'andrew cole'] },
      { text: 'Sergio Agüero', rank: 5, points: 5, normalized: 'sergio aguero', aliases: ['aguero', 'agüero', 'kun aguero'] },
      { text: 'Frank Lampard', rank: 6, points: 6, normalized: 'frank lampard', aliases: ['lampard'] },
      { text: 'Thierry Henry', rank: 7, points: 7, normalized: 'thierry henry', aliases: ['henry'] },
      { text: 'Robbie Fowler', rank: 8, points: 8, normalized: 'robbie fowler', aliases: ['fowler'] },
      { text: 'Jermain Defoe', rank: 9, points: 9, normalized: 'jermain defoe', aliases: ['defoe'] },
      { text: 'Michael Owen', rank: 10, points: 10, normalized: 'michael owen', aliases: ['owen'] }
    ]
  },
  {
    id: 'sports-12',
    category: 'Sports',
    title: 'Top 10 FIFA Ballon d\'Or total winners',
    difficulty: 'hard',
    answers: [
      { text: 'Lionel Messi', rank: 1, points: 1, normalized: 'lionel messi', aliases: ['messi'] },
      { text: 'Cristiano Ronaldo', rank: 2, points: 2, normalized: 'cristiano ronaldo', aliases: ['ronaldo', 'cr7'] },
      { text: 'Michel Platini', rank: 3, points: 3, normalized: 'michel platini', aliases: ['platini'] },
      { text: 'Johan Cruyff', rank: 4, points: 4, normalized: 'johan cruyff', aliases: ['cruyff', 'cruijff'] },
      { text: 'Marco van Basten', rank: 5, points: 5, normalized: 'marco van basten', aliases: ['van basten'] },
      { text: 'Franz Beckenbauer', rank: 6, points: 6, normalized: 'franz beckenbauer', aliases: ['beckenbauer'] },
      { text: 'Alfredo Di Stéfano', rank: 7, points: 7, normalized: 'alfredo di stefano', aliases: ['di stéfano', 'di stefano'] },
      { text: 'Ronaldinho', rank: 8, points: 8, normalized: 'ronaldinho' },
      { text: 'Karim Benzema', rank: 9, points: 9, normalized: 'karim benzema', aliases: ['benzema'] },
      { text: 'George Best', rank: 10, points: 10, normalized: 'george best', aliases: ['best'] }
    ]
  },
  {
    id: 'sports-13',
    category: 'Sports',
    title: 'Top 10 countries by UEFA European Championship titles',
    difficulty: 'hard',
    answers: [
      { text: 'Germany', rank: 1, points: 1, normalized: 'germany' },
      { text: 'Spain', rank: 2, points: 2, normalized: 'spain' },
      { text: 'Italy', rank: 3, points: 3, normalized: 'italy' },
      { text: 'France', rank: 4, points: 4, normalized: 'france' },
      { text: 'Soviet Union', rank: 5, points: 5, normalized: 'soviet union', aliases: ['ussr'] },
      { text: 'Portugal', rank: 6, points: 6, normalized: 'portugal' },
      { text: 'Netherlands', rank: 7, points: 7, normalized: 'netherlands', aliases: ['holland'] },
      { text: 'Denmark', rank: 8, points: 8, normalized: 'denmark' },
      { text: 'Czech Republic', rank: 9, points: 9, normalized: 'czech republic', aliases: ['czechia'] },
      { text: 'Greece', rank: 10, points: 10, normalized: 'greece' }
    ]
  },
  {
    id: 'sports-14',
    category: 'Sports',
    title: 'Top 10 most capped men\'s international footballers',
    difficulty: 'hard',
    answers: [
      { text: 'Cristiano Ronaldo', rank: 1, points: 1, normalized: 'cristiano ronaldo', aliases: ['ronaldo', 'cr7'] },
      { text: 'Bader Al-Mutawa', rank: 2, points: 2, normalized: 'bader al-mutawa', aliases: ['al-mutawa'] },
      { text: 'Soh Chin Ann', rank: 3, points: 3, normalized: 'soh chin ann' },
      { text: 'Ahmed Hassan', rank: 4, points: 4, normalized: 'ahmed hassan' },
      { text: 'Lionel Messi', rank: 5, points: 5, normalized: 'lionel messi', aliases: ['messi'] },
      { text: 'Sergio Ramos', rank: 6, points: 6, normalized: 'sergio ramos', aliases: ['ramos'] },
      { text: 'Gianluigi Buffon', rank: 7, points: 7, normalized: 'gianluigi buffon', aliases: ['buffon'] },
      { text: 'Sunil Chhetri', rank: 8, points: 8, normalized: 'sunil chhetri', aliases: ['chhetri'] },
      { text: 'Luka Modrić', rank: 9, points: 9, normalized: 'luka modric', aliases: ['modrić', 'modric'] },
      { text: 'Andrés Guardado', rank: 10, points: 10, normalized: 'andres guardado', aliases: ['guardado', 'andrés guardado'] }
    ]
  },
  {
    id: 'sports-15',
    category: 'Sports',
    title: 'Top 10 most goals in a single FIFA World Cup tournament',
    difficulty: 'hard',
    answers: [
      { text: 'Just Fontaine', rank: 1, points: 1, normalized: 'just fontaine', aliases: ['fontaine'] },
      { text: 'Kylian Mbappé', rank: 2, points: 2, normalized: 'kylian mbappe', aliases: ['mbappe', 'mbappé'] },
      { text: 'Ronaldo Nazário', rank: 3, points: 3, normalized: 'ronaldo nazario', aliases: ['ronaldo', 'r9', 'ronaldo nazário'] },
      { text: 'Gerd Müller', rank: 4, points: 4, normalized: 'gerd muller', aliases: ['gerd müller', 'muller'] },
      { text: 'Sándor Kocsis', rank: 5, points: 5, normalized: 'sandor kocsis', aliases: ['sándor kocsis', 'kocsis'] },
      { text: 'Ademir', rank: 6, points: 6, normalized: 'ademir' },
      { text: 'Leônidas', rank: 7, points: 7, normalized: 'leonidas', aliases: ['leônidas'] },
      { text: 'Pelé', rank: 8, points: 8, normalized: 'pele', aliases: ['pelé'] },
      { text: 'Gary Lineker', rank: 9, points: 9, normalized: 'gary lineker', aliases: ['lineker'] },
      { text: 'Thomas Müller', rank: 10, points: 10, normalized: 'thomas muller', aliases: ['thomas müller', 'muller', 'müller'] }
    ]
  },
  {
    id: 'sports-16',
    category: 'Sports',
    title: 'Top 10 football clubs by domestic league titles',
    difficulty: 'hard',
    answers: [
      { text: 'Rangers', rank: 1, points: 1, normalized: 'rangers', aliases: ['glasgow rangers'] },
      { text: 'Celtic', rank: 2, points: 2, normalized: 'celtic', aliases: ['glasgow celtic'] },
      { text: 'Real Madrid', rank: 3, points: 3, normalized: 'real madrid', aliases: ['madrid'] },
      { text: 'Barcelona', rank: 4, points: 4, normalized: 'barcelona', aliases: ['barca', 'barça'] },
      { text: 'Bayern Munich', rank: 5, points: 5, normalized: 'bayern munich', aliases: ['bayern', 'bayern münchen'] },
      { text: 'Benfica', rank: 6, points: 6, normalized: 'benfica' },
      { text: 'Porto', rank: 7, points: 7, normalized: 'porto', aliases: ['fc porto'] },
      { text: 'Juventus', rank: 8, points: 8, normalized: 'juventus', aliases: ['juve'] },
      { text: 'Galatasaray', rank: 9, points: 9, normalized: 'galatasaray', aliases: ['gala'] },
      { text: 'Olympiacos', rank: 10, points: 10, normalized: 'olympiacos', aliases: ['olympiakos'] }
    ]
  },
  {
    id: 'sports-17',
    category: 'Sports',
    title: 'Top 10 NBA teams by championships',
    difficulty: 'medium',
    answers: [
      { text: 'Boston Celtics', rank: 1, points: 1, normalized: 'boston celtics', aliases: ['celtics'] },
      { text: 'Los Angeles Lakers', rank: 2, points: 2, normalized: 'los angeles lakers', aliases: ['lakers', 'la lakers'] },
      { text: 'Golden State Warriors', rank: 3, points: 3, normalized: 'golden state warriors', aliases: ['warriors', 'gsw'] },
      { text: 'Chicago Bulls', rank: 4, points: 4, normalized: 'chicago bulls', aliases: ['bulls'] },
      { text: 'San Antonio Spurs', rank: 5, points: 5, normalized: 'san antonio spurs', aliases: ['spurs'] },
      { text: 'Miami Heat', rank: 6, points: 6, normalized: 'miami heat', aliases: ['heat'] },
      { text: 'Philadelphia 76ers', rank: 7, points: 7, normalized: 'philadelphia 76ers', aliases: ['76ers', 'sixers'] },
      { text: 'Detroit Pistons', rank: 8, points: 8, normalized: 'detroit pistons', aliases: ['pistons'] },
      { text: 'New York Knicks', rank: 9, points: 9, normalized: 'new york knicks', aliases: ['knicks'] },
      { text: 'Houston Rockets', rank: 10, points: 10, normalized: 'houston rockets', aliases: ['rockets'] }
    ]
  },
  {
    id: 'sports-18',
    category: 'Sports',
    title: 'Top 10 NBA all-time scorers',
    difficulty: 'medium',
    answers: [
      { text: 'LeBron James', rank: 1, points: 1, normalized: 'lebron james', aliases: ['lebron', 'king james'] },
      { text: 'Kareem Abdul-Jabbar', rank: 2, points: 2, normalized: 'kareem abdul-jabbar', aliases: ['kareem', 'abdul-jabbar'] },
      { text: 'Karl Malone', rank: 3, points: 3, normalized: 'karl malone', aliases: ['malone', 'the mailman'] },
      { text: 'Kobe Bryant', rank: 4, points: 4, normalized: 'kobe bryant', aliases: ['kobe', 'black mamba'] },
      { text: 'Michael Jordan', rank: 5, points: 5, normalized: 'michael jordan', aliases: ['jordan', 'mj'] },
      { text: 'Dirk Nowitzki', rank: 6, points: 6, normalized: 'dirk nowitzki', aliases: ['nowitzki', 'dirk'] },
      { text: 'Wilt Chamberlain', rank: 7, points: 7, normalized: 'wilt chamberlain', aliases: ['chamberlain', 'wilt'] },
      { text: 'Kevin Durant', rank: 8, points: 8, normalized: 'kevin durant', aliases: ['durant', 'kd'] },
      { text: 'Shaquille O\'Neal', rank: 9, points: 9, normalized: 'shaquille oneal', aliases: ['shaq', 'o\'neal'] },
      { text: 'Carmelo Anthony', rank: 10, points: 10, normalized: 'carmelo anthony', aliases: ['melo', 'carmelo'] }
    ]
  },
  {
    id: 'sports-19',
    category: 'Sports',
    title: 'Top 10 NBA MVP award winners by total awards',
    difficulty: 'hard',
    answers: [
      { text: 'Kareem Abdul-Jabbar', rank: 1, points: 1, normalized: 'kareem abdul-jabbar', aliases: ['kareem', 'abdul-jabbar'] },
      { text: 'Michael Jordan', rank: 2, points: 2, normalized: 'michael jordan', aliases: ['jordan', 'mj'] },
      { text: 'LeBron James', rank: 3, points: 3, normalized: 'lebron james', aliases: ['lebron', 'king james'] },
      { text: 'Bill Russell', rank: 4, points: 4, normalized: 'bill russell', aliases: ['russell'] },
      { text: 'Wilt Chamberlain', rank: 5, points: 5, normalized: 'wilt chamberlain', aliases: ['chamberlain', 'wilt'] },
      { text: 'Magic Johnson', rank: 6, points: 6, normalized: 'magic johnson', aliases: ['magic'] },
      { text: 'Larry Bird', rank: 7, points: 7, normalized: 'larry bird', aliases: ['bird'] },
      { text: 'Moses Malone', rank: 8, points: 8, normalized: 'moses malone', aliases: ['malone'] },
      { text: 'Nikola Jokić', rank: 9, points: 9, normalized: 'nikola jokic', aliases: ['jokić', 'jokic', 'joker'] },
      { text: 'Stephen Curry', rank: 10, points: 10, normalized: 'stephen curry', aliases: ['curry', 'steph'] }
    ]
  },
  {
    id: 'sports-20',
    category: 'Sports',
    title: 'Top 10 NBA players with most championships',
    difficulty: 'medium',
    answers: [
      { text: 'Bill Russell', rank: 1, points: 1, normalized: 'bill russell', aliases: ['russell'] },
      { text: 'Sam Jones', rank: 2, points: 2, normalized: 'sam jones' },
      { text: 'Tom Heinsohn', rank: 3, points: 3, normalized: 'tom heinsohn', aliases: ['heinsohn'] },
      { text: 'K.C. Jones', rank: 4, points: 4, normalized: 'kc jones', aliases: ['k.c. jones'] },
      { text: 'Satch Sanders', rank: 5, points: 5, normalized: 'satch sanders', aliases: ['sanders'] },
      { text: 'John Havlicek', rank: 6, points: 6, normalized: 'john havlicek', aliases: ['havlicek'] },
      { text: 'Jim Loscutoff', rank: 7, points: 7, normalized: 'jim loscutoff', aliases: ['loscutoff'] },
      { text: 'Frank Ramsey', rank: 8, points: 8, normalized: 'frank ramsey', aliases: ['ramsey'] },
      { text: 'Robert Horry', rank: 9, points: 9, normalized: 'robert horry', aliases: ['horry'] },
      { text: 'Michael Jordan', rank: 10, points: 10, normalized: 'michael jordan', aliases: ['jordan', 'mj'] }
    ]
  },
  {
    id: 'sports-21',
    category: 'Sports',
    title: 'Top 10 men\'s Grand Slam singles title winners',
    difficulty: 'medium',
    answers: [
      { text: 'Novak Djokovic', rank: 1, points: 1, normalized: 'novak djokovic', aliases: ['djokovic', 'nole'] },
      { text: 'Rafael Nadal', rank: 2, points: 2, normalized: 'rafael nadal', aliases: ['nadal', 'rafa'] },
      { text: 'Roger Federer', rank: 3, points: 3, normalized: 'roger federer', aliases: ['federer'] },
      { text: 'Pete Sampras', rank: 4, points: 4, normalized: 'pete sampras', aliases: ['sampras'] },
      { text: 'Roy Emerson', rank: 5, points: 5, normalized: 'roy emerson', aliases: ['emerson'] },
      { text: 'Rod Laver', rank: 6, points: 6, normalized: 'rod laver', aliases: ['laver'] },
      { text: 'Björn Borg', rank: 7, points: 7, normalized: 'bjorn borg', aliases: ['björn borg', 'borg'] },
      { text: 'Jimmy Connors', rank: 8, points: 8, normalized: 'jimmy connors', aliases: ['connors'] },
      { text: 'Ivan Lendl', rank: 9, points: 9, normalized: 'ivan lendl', aliases: ['lendl'] },
      { text: 'Andre Agassi', rank: 10, points: 10, normalized: 'andre agassi', aliases: ['agassi'] }
    ]
  },
  {
    id: 'sports-22',
    category: 'Sports',
    title: 'Top 10 women\'s Grand Slam singles title winners',
    difficulty: 'medium',
    answers: [
      { text: 'Margaret Court', rank: 1, points: 1, normalized: 'margaret court', aliases: ['court'] },
      { text: 'Serena Williams', rank: 2, points: 2, normalized: 'serena williams', aliases: ['serena'] },
      { text: 'Steffi Graf', rank: 3, points: 3, normalized: 'steffi graf', aliases: ['graf'] },
      { text: 'Helen Wills', rank: 4, points: 4, normalized: 'helen wills', aliases: ['wills'] },
      { text: 'Chris Evert', rank: 5, points: 5, normalized: 'chris evert', aliases: ['evert'] },
      { text: 'Martina Navratilova', rank: 6, points: 6, normalized: 'martina navratilova', aliases: ['navratilova'] },
      { text: 'Billie Jean King', rank: 7, points: 7, normalized: 'billie jean king', aliases: ['king'] },
      { text: 'Monica Seles', rank: 8, points: 8, normalized: 'monica seles', aliases: ['seles'] },
      { text: 'Suzanne Lenglen', rank: 9, points: 9, normalized: 'suzanne lenglen', aliases: ['lenglen'] },
      { text: 'Justine Henin', rank: 10, points: 10, normalized: 'justine henin', aliases: ['henin'] }
    ]
  },
  {
    id: 'sports-23',
    category: 'Sports',
    title: 'Top 10 countries by Davis Cup titles',
    difficulty: 'hard',
    answers: [
      { text: 'United States', rank: 1, points: 1, normalized: 'united states', aliases: ['usa', 'us', 'america'] },
      { text: 'Australia', rank: 2, points: 2, normalized: 'australia' },
      { text: 'France', rank: 3, points: 3, normalized: 'france' },
      { text: 'Great Britain', rank: 4, points: 4, normalized: 'great britain', aliases: ['uk', 'britain'] },
      { text: 'Spain', rank: 5, points: 5, normalized: 'spain' },
      { text: 'Sweden', rank: 6, points: 6, normalized: 'sweden' },
      { text: 'Italy', rank: 7, points: 7, normalized: 'italy' },
      { text: 'Germany', rank: 8, points: 8, normalized: 'germany' },
      { text: 'Russia', rank: 9, points: 9, normalized: 'russia' },
      { text: 'Czech Republic', rank: 10, points: 10, normalized: 'czech republic', aliases: ['czechia'] }
    ]
  },

  // Movies Category
  {
    id: 'movies-1',
    category: 'Movies',
    title: 'Top 10 highest-grossing movies of all time',
    difficulty: 'easy',
    answers: [
      { text: 'Avatar', rank: 1, points: 1, normalized: 'avatar' },
      { text: 'Avengers: Endgame', rank: 2, points: 2, normalized: 'avengers endgame', aliases: ['endgame'] },
      { text: 'Avatar: The Way of Water', rank: 3, points: 3, normalized: 'avatar the way of water', aliases: ['avatar 2'] },
      { text: 'Titanic', rank: 4, points: 4, normalized: 'titanic' },
      { text: 'Ne Zha 2', rank: 5, points: 5, normalized: 'ne zha 2', aliases: ['nezha 2'] },
      { text: 'Star Wars: The Force Awakens', rank: 6, points: 6, normalized: 'star wars the force awakens', aliases: ['force awakens', 'star wars 7'] },
      { text: 'Avengers: Infinity War', rank: 7, points: 7, normalized: 'avengers infinity war', aliases: ['infinity war'] },
      { text: 'Spider-Man: No Way Home', rank: 8, points: 8, normalized: 'spider-man no way home', aliases: ['no way home'] },
      { text: 'Zootopia 2', rank: 9, points: 9, normalized: 'zootopia 2' },
      { text: 'Inside Out 2', rank: 10, points: 10, normalized: 'inside out 2' }
    ]
  },
  {
    id: 'movies-2',
    category: 'Movies',
    title: 'Top 10 highest-grossing animated movies of all time',
    difficulty: 'easy',
    answers: [
      { text: 'Ne Zha 2', rank: 1, points: 1, normalized: 'ne zha 2', aliases: ['nezha 2'] },
      { text: 'Zootopia 2', rank: 2, points: 2, normalized: 'zootopia 2' },
      { text: 'Inside Out 2', rank: 3, points: 3, normalized: 'inside out 2' },
      { text: 'Frozen II', rank: 4, points: 4, normalized: 'frozen ii', aliases: ['frozen 2'] },
      { text: 'The Super Mario Bros. Movie', rank: 5, points: 5, normalized: 'the super mario bros movie', aliases: ['mario movie', 'super mario movie'] },
      { text: 'Frozen', rank: 6, points: 6, normalized: 'frozen' },
      { text: 'Incredibles 2', rank: 7, points: 7, normalized: 'incredibles 2' },
      { text: 'Minions', rank: 8, points: 8, normalized: 'minions' },
      { text: 'Toy Story 4', rank: 9, points: 9, normalized: 'toy story 4' },
      { text: 'Toy Story 3', rank: 10, points: 10, normalized: 'toy story 3' }
    ]
  },
  {
    id: 'movies-3',
    category: 'Movies',
    title: 'Top 10 highest-grossing documentary films worldwide',
    difficulty: 'hard',
    answers: [
      { text: 'Michael Jackson\'s This Is It', rank: 1, points: 1, normalized: 'michael jacksons this is it', aliases: ['this is it'] },
      { text: 'Grand Canyon: The Hidden Secrets', rank: 2, points: 2, normalized: 'grand canyon the hidden secrets', aliases: ['grand canyon'] },
      { text: 'Fahrenheit 9/11', rank: 3, points: 3, normalized: 'fahrenheit 9/11', aliases: ['fahrenheit 911'] },
      { text: 'March of the Penguins', rank: 4, points: 4, normalized: 'march of the penguins', aliases: ['la marche de lempereur'] },
      { text: 'Everest', rank: 5, points: 5, normalized: 'everest' },
      { text: 'Space Station 3D', rank: 6, points: 6, normalized: 'space station 3d' },
      { text: 'To Fly!', rank: 7, points: 7, normalized: 'to fly' },
      { text: 'Earth', rank: 8, points: 8, normalized: 'earth' },
      { text: 'Deep Sea 3D', rank: 9, points: 9, normalized: 'deep sea 3d' },
      { text: 'An Inconvenient Truth', rank: 10, points: 10, normalized: 'an inconvenient truth', aliases: ['inconvenient truth'] }
    ]
  },
  {
    id: 'movies-4',
    category: 'Movies',
    title: 'Top 10 highest-grossing films to hit $1 billion milestone',
    difficulty: 'hard',
    answers: [
      { text: 'Titanic', rank: 1, points: 1, normalized: 'titanic' },
      { text: 'The Lord of the Rings: The Return of the King', rank: 2, points: 2, normalized: 'the lord of the rings the return of the king', aliases: ['return of the king', 'lotr 3'] },
      { text: 'Pirates of the Caribbean: Dead Man\'s Chest', rank: 3, points: 3, normalized: 'pirates of the caribbean dead mans chest', aliases: ['dead mans chest', 'pirates 2'] },
      { text: 'Spider-Man 3', rank: 4, points: 4, normalized: 'spider-man 3', aliases: ['spiderman 3'] },
      { text: 'Transformers: Dark of the Moon', rank: 5, points: 5, normalized: 'transformers dark of the moon', aliases: ['transformers 3'] },
      { text: 'Avatar', rank: 6, points: 6, normalized: 'avatar' },
      { text: 'Harry Potter and the Deathly Hallows – Part 2', rank: 7, points: 7, normalized: 'harry potter and the deathly hallows part 2', aliases: ['deathly hallows 2', 'harry potter 8'] },
      { text: 'Frozen', rank: 8, points: 8, normalized: 'frozen' },
      { text: 'Jurassic World', rank: 9, points: 9, normalized: 'jurassic world' },
      { text: 'Beauty and the Beast', rank: 10, points: 10, normalized: 'beauty and the beast' }
    ]
  },
  {
    id: 'movies-5',
    category: 'Movies',
    title: 'Top 10 Cannes Film Festival Palme d\'Or winners (highest grossing)',
    difficulty: 'hard',
    answers: [
      { text: 'Fahrenheit 9/11', rank: 1, points: 1, normalized: 'fahrenheit 9/11', aliases: ['fahrenheit 911'] },
      { text: 'Pulp Fiction', rank: 2, points: 2, normalized: 'pulp fiction' },
      { text: 'Apocalypse Now', rank: 3, points: 3, normalized: 'apocalypse now' },
      { text: 'The Piano', rank: 4, points: 4, normalized: 'the piano' },
      { text: 'All About Eve', rank: 5, points: 5, normalized: 'all about eve' },
      { text: 'Parasite', rank: 6, points: 6, normalized: 'parasite' },
      { text: 'The Pianist', rank: 7, points: 7, normalized: 'the pianist' },
      { text: 'MASH', rank: 8, points: 8, normalized: 'mash', aliases: ['m*a*s*h'] },
      { text: 'Taxi Driver', rank: 9, points: 9, normalized: 'taxi driver' },
      { text: 'sex, lies, and videotape', rank: 10, points: 10, normalized: 'sex lies and videotape' }
    ]
  },
  {
    id: 'movies-8',
    category: 'Movies',
    title: 'Top 10 films that were first to break major box office records',
    difficulty: 'hard',
    answers: [
      { text: 'The Birth of a Nation', rank: 1, points: 1, normalized: 'the birth of a nation' },
      { text: 'Gone with the Wind', rank: 2, points: 2, normalized: 'gone with the wind' },
      { text: 'Star Wars', rank: 3, points: 3, normalized: 'star wars', aliases: ['star wars a new hope', 'a new hope'] },
      { text: 'Jaws', rank: 4, points: 4, normalized: 'jaws' },
      { text: 'E.T. the Extra-Terrestrial', rank: 5, points: 5, normalized: 'et the extra-terrestrial', aliases: ['et', 'e.t.'] },
      { text: 'Titanic', rank: 6, points: 6, normalized: 'titanic' },
      { text: 'Avatar', rank: 7, points: 7, normalized: 'avatar' },
      { text: 'Avengers: Endgame', rank: 8, points: 8, normalized: 'avengers endgame', aliases: ['endgame'] },
      { text: 'Ne Zha 2', rank: 9, points: 9, normalized: 'ne zha 2', aliases: ['nezha 2'] },
      { text: 'Inside Out 2', rank: 10, points: 10, normalized: 'inside out 2' }
    ]
  },
  {
    id: 'movies-9',
    category: 'Movies',
    title: 'Top 10 films that held highest-grossing title historically',
    difficulty: 'hard',
    answers: [
      { text: 'Gone with the Wind', rank: 1, points: 1, normalized: 'gone with the wind' },
      { text: 'The Sound of Music', rank: 2, points: 2, normalized: 'the sound of music', aliases: ['sound of music'] },
      { text: 'Jaws', rank: 3, points: 3, normalized: 'jaws' },
      { text: 'Star Wars', rank: 4, points: 4, normalized: 'star wars', aliases: ['star wars a new hope', 'a new hope'] },
      { text: 'E.T. the Extra-Terrestrial', rank: 5, points: 5, normalized: 'et the extra-terrestrial', aliases: ['et', 'e.t.'] },
      { text: 'Titanic', rank: 6, points: 6, normalized: 'titanic' },
      { text: 'Avatar', rank: 7, points: 7, normalized: 'avatar' },
      { text: 'Avengers: Endgame', rank: 8, points: 8, normalized: 'avengers endgame', aliases: ['endgame'] },
      { text: 'Avatar: The Way of Water', rank: 9, points: 9, normalized: 'avatar the way of water', aliases: ['avatar 2'] },
      { text: 'Ne Zha 2', rank: 10, points: 10, normalized: 'ne zha 2', aliases: ['nezha 2'] }
    ]
  },
  {
    id: 'movies-10',
    category: 'Movies',
    title: 'Top 10 animated feature films released in 2024 by worldwide gross',
    difficulty: 'medium',
    answers: [
      { text: 'Inside Out 2', rank: 1, points: 1, normalized: 'inside out 2' },
      { text: 'Moana 2', rank: 2, points: 2, normalized: 'moana 2' },
      { text: 'Despicable Me 4', rank: 3, points: 3, normalized: 'despicable me 4' },
      { text: 'Mufasa: The Lion King', rank: 4, points: 4, normalized: 'mufasa the lion king', aliases: ['mufasa'] },
      { text: 'Kung Fu Panda 4', rank: 5, points: 5, normalized: 'kung fu panda 4' },
      { text: 'The Wild Robot', rank: 6, points: 6, normalized: 'the wild robot', aliases: ['wild robot'] },
      { text: 'Boonie Bears: Time Twist', rank: 7, points: 7, normalized: 'boonie bears time twist', aliases: ['boonie bears'] },
      { text: 'The Garfield Movie', rank: 8, points: 8, normalized: 'the garfield movie', aliases: ['garfield'] },
      { text: 'Transformers One', rank: 9, points: 9, normalized: 'transformers one' },
      { text: 'Detective Conan: The Million-Dollar Pentagram', rank: 10, points: 10, normalized: 'detective conan the million-dollar pentagram', aliases: ['detective conan'] }
    ]
  },
  {
    id: 'movies-11',
    category: 'Movies',
    title: 'Top 10 films that won Best Picture at the Academy Awards',
    difficulty: 'medium',
    answers: [
      { text: 'Gone with the Wind', rank: 1, points: 1, normalized: 'gone with the wind' },
      { text: 'The Godfather', rank: 2, points: 2, normalized: 'the godfather' },
      { text: 'Titanic', rank: 3, points: 3, normalized: 'titanic' },
      { text: 'Forrest Gump', rank: 4, points: 4, normalized: 'forrest gump' },
      { text: 'Schindler\'s List', rank: 5, points: 5, normalized: 'schindlers list' },
      { text: 'Braveheart', rank: 6, points: 6, normalized: 'braveheart' },
      { text: 'Gladiator', rank: 7, points: 7, normalized: 'gladiator' },
      { text: 'The Lord of the Rings: The Return of the King', rank: 8, points: 8, normalized: 'the lord of the rings the return of the king', aliases: ['return of the king'] },
      { text: 'No Country for Old Men', rank: 9, points: 9, normalized: 'no country for old men' },
      { text: 'Parasite', rank: 10, points: 10, normalized: 'parasite' }
    ]
  },
  {
    id: 'movies-12',
    category: 'Movies',
    title: 'Top 10 highest-grossing films of 2017 worldwide',
    difficulty: 'medium',
    answers: [
      { text: 'Star Wars: The Last Jedi', rank: 1, points: 1, normalized: 'star wars the last jedi', aliases: ['last jedi', 'star wars 8'] },
      { text: 'Beauty and the Beast', rank: 2, points: 2, normalized: 'beauty and the beast' },
      { text: 'The Fate of the Furious', rank: 3, points: 3, normalized: 'the fate of the furious', aliases: ['fast 8', 'furious 8'] },
      { text: 'Despicable Me 3', rank: 4, points: 4, normalized: 'despicable me 3' },
      { text: 'Jumanji: Welcome to the Jungle', rank: 5, points: 5, normalized: 'jumanji welcome to the jungle', aliases: ['jumanji'] },
      { text: 'Spider-Man: Homecoming', rank: 6, points: 6, normalized: 'spider-man homecoming', aliases: ['homecoming'] },
      { text: 'Wolf Warrior 2', rank: 7, points: 7, normalized: 'wolf warrior 2' },
      { text: 'Guardians of the Galaxy Vol. 2', rank: 8, points: 8, normalized: 'guardians of the galaxy vol 2', aliases: ['guardians 2', 'gotg 2'] },
      { text: 'Thor: Ragnarok', rank: 9, points: 9, normalized: 'thor ragnarok', aliases: ['ragnarok'] },
      { text: 'Wonder Woman', rank: 10, points: 10, normalized: 'wonder woman' }
    ]
  },
  {
    id: 'movies-13',
    category: 'Movies',
    title: 'Top 10 movies with most Academy Award wins',
    difficulty: 'hard',
    answers: [
      { text: 'Ben-Hur', rank: 1, points: 1, normalized: 'ben-hur', aliases: ['ben hur'] },
      { text: 'Titanic', rank: 2, points: 2, normalized: 'titanic' },
      { text: 'The Lord of the Rings: The Return of the King', rank: 3, points: 3, normalized: 'the lord of the rings the return of the king', aliases: ['return of the king', 'lotr 3'] },
      { text: 'West Side Story', rank: 4, points: 4, normalized: 'west side story' },
      { text: 'The English Patient', rank: 5, points: 5, normalized: 'the english patient' },
      { text: 'The Last Emperor', rank: 6, points: 6, normalized: 'the last emperor' },
      { text: 'Gigi', rank: 7, points: 7, normalized: 'gigi' },
      { text: 'Gandhi', rank: 8, points: 8, normalized: 'gandhi' },
      { text: 'Amadeus', rank: 9, points: 9, normalized: 'amadeus' },
      { text: 'Slumdog Millionaire', rank: 10, points: 10, normalized: 'slumdog millionaire', aliases: ['slumdog'] }
    ]
  },
  {
    id: 'movies-14',
    category: 'Movies',
    title: 'Top 10 highest-grossing movie franchises of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Marvel Cinematic Universe', rank: 1, points: 1, normalized: 'marvel cinematic universe', aliases: ['mcu', 'marvel'] },
      { text: 'Star Wars', rank: 2, points: 2, normalized: 'star wars' },
      { text: 'Wizarding World (Harry Potter)', rank: 3, points: 3, normalized: 'wizarding world', aliases: ['harry potter', 'wizarding world'] },
      { text: 'Spider-Man', rank: 4, points: 4, normalized: 'spider-man', aliases: ['spiderman'] },
      { text: 'James Bond', rank: 5, points: 5, normalized: 'james bond', aliases: ['007', 'bond'] },
      { text: 'Fast & Furious', rank: 6, points: 6, normalized: 'fast & furious', aliases: ['fast and furious', 'f&f'] },
      { text: 'Jurassic Park / World', rank: 7, points: 7, normalized: 'jurassic park', aliases: ['jurassic world', 'jurassic'] },
      { text: 'DC Extended Universe', rank: 8, points: 8, normalized: 'dc extended universe', aliases: ['dceu', 'dc'] },
      { text: 'Transformers', rank: 9, points: 9, normalized: 'transformers' },
      { text: 'The Lord of the Rings / Hobbit', rank: 10, points: 10, normalized: 'the lord of the rings', aliases: ['lotr', 'hobbit', 'lord of the rings'] }
    ]
  },
  {
    id: 'movies-15',
    category: 'Movies',
    title: 'Top 10 highest-grossing superhero movies of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Avengers: Endgame', rank: 1, points: 1, normalized: 'avengers endgame', aliases: ['endgame'] },
      { text: 'Avengers: Infinity War', rank: 2, points: 2, normalized: 'avengers infinity war', aliases: ['infinity war'] },
      { text: 'Spider-Man: No Way Home', rank: 3, points: 3, normalized: 'spider-man no way home', aliases: ['no way home'] },
      { text: 'The Avengers', rank: 4, points: 4, normalized: 'the avengers' },
      { text: 'Avengers: Age of Ultron', rank: 5, points: 5, normalized: 'avengers age of ultron', aliases: ['age of ultron'] },
      { text: 'Black Panther', rank: 6, points: 6, normalized: 'black panther' },
      { text: 'Deadpool & Wolverine', rank: 7, points: 7, normalized: 'deadpool & wolverine', aliases: ['deadpool and wolverine', 'deadpool 3'] },
      { text: 'Iron Man 3', rank: 8, points: 8, normalized: 'iron man 3' },
      { text: 'Captain America: Civil War', rank: 9, points: 9, normalized: 'captain america civil war', aliases: ['civil war'] },
      { text: 'Aquaman', rank: 10, points: 10, normalized: 'aquaman' }
    ]
  },
  {
    id: 'movies-16',
    category: 'Movies',
    title: 'Top 10 actors with most Oscar nominations',
    difficulty: 'hard',
    answers: [
      { text: 'Meryl Streep', rank: 1, points: 1, normalized: 'meryl streep', aliases: ['streep'] },
      { text: 'Katharine Hepburn', rank: 2, points: 2, normalized: 'katharine hepburn', aliases: ['hepburn'] },
      { text: 'Jack Nicholson', rank: 3, points: 3, normalized: 'jack nicholson', aliases: ['nicholson'] },
      { text: 'Bette Davis', rank: 4, points: 4, normalized: 'bette davis' },
      { text: 'Laurence Olivier', rank: 5, points: 5, normalized: 'laurence olivier', aliases: ['olivier'] },
      { text: 'Denzel Washington', rank: 6, points: 6, normalized: 'denzel washington', aliases: ['denzel'] },
      { text: 'Spencer Tracy', rank: 7, points: 7, normalized: 'spencer tracy', aliases: ['tracy'] },
      { text: 'Al Pacino', rank: 8, points: 8, normalized: 'al pacino', aliases: ['pacino'] },
      { text: 'Paul Newman', rank: 9, points: 9, normalized: 'paul newman', aliases: ['newman'] },
      { text: 'Jack Lemmon', rank: 10, points: 10, normalized: 'jack lemmon', aliases: ['lemmon'] }
    ]
  },
  {
    id: 'movies-17',
    category: 'Movies',
    title: 'Top 10 highest-rated movies on IMDb',
    difficulty: 'medium',
    answers: [
      { text: 'The Shawshank Redemption', rank: 1, points: 1, normalized: 'the shawshank redemption', aliases: ['shawshank'] },
      { text: 'The Godfather', rank: 2, points: 2, normalized: 'the godfather' },
      { text: 'The Dark Knight', rank: 3, points: 3, normalized: 'the dark knight' },
      { text: 'The Godfather Part II', rank: 4, points: 4, normalized: 'the godfather part ii', aliases: ['godfather 2', 'godfather part 2'] },
      { text: '12 Angry Men', rank: 5, points: 5, normalized: '12 angry men', aliases: ['twelve angry men'] },
      { text: 'Schindler\'s List', rank: 6, points: 6, normalized: 'schindlers list', aliases: ['schindler\'s list'] },
      { text: 'The Lord of the Rings: The Return of the King', rank: 7, points: 7, normalized: 'the lord of the rings the return of the king', aliases: ['return of the king'] },
      { text: 'Pulp Fiction', rank: 8, points: 8, normalized: 'pulp fiction' },
      { text: 'The Lord of the Rings: The Fellowship of the Ring', rank: 9, points: 9, normalized: 'the lord of the rings the fellowship of the ring', aliases: ['fellowship of the ring'] },
      { text: 'The Good, the Bad and the Ugly', rank: 10, points: 10, normalized: 'the good the bad and the ugly', aliases: ['good bad ugly'] }
    ]
  },
  {
    id: 'movies-18',
    category: 'Movies',
    title: 'Top 10 highest-grossing R-rated movies of all time',
    difficulty: 'hard',
    answers: [
      { text: 'Deadpool & Wolverine', rank: 1, points: 1, normalized: 'deadpool & wolverine', aliases: ['deadpool and wolverine', 'deadpool 3'] },
      { text: 'Joker', rank: 2, points: 2, normalized: 'joker' },
      { text: 'Oppenheimer', rank: 3, points: 3, normalized: 'oppenheimer' },
      { text: 'Deadpool 2', rank: 4, points: 4, normalized: 'deadpool 2' },
      { text: 'Deadpool', rank: 5, points: 5, normalized: 'deadpool' },
      { text: 'The Matrix Reloaded', rank: 6, points: 6, normalized: 'the matrix reloaded', aliases: ['matrix reloaded', 'matrix 2'] },
      { text: 'It', rank: 7, points: 7, normalized: 'it', aliases: ['it 2017', 'pennywise'] },
      { text: 'Logan', rank: 8, points: 8, normalized: 'logan' },
      { text: 'The Passion of the Christ', rank: 9, points: 9, normalized: 'the passion of the christ', aliases: ['passion of the christ'] },
      { text: 'The Hangover Part II', rank: 10, points: 10, normalized: 'the hangover part ii', aliases: ['hangover 2', 'hangover part 2'] }
    ]
  },
  {
    id: 'movies-19',
    category: 'Movies',
    title: 'Top 10 movies with most Oscar nominations',
    difficulty: 'hard',
    answers: [
      { text: 'All About Eve', rank: 1, points: 1, normalized: 'all about eve' },
      { text: 'Titanic', rank: 2, points: 2, normalized: 'titanic' },
      { text: 'La La Land', rank: 3, points: 3, normalized: 'la la land' },
      { text: 'Gone with the Wind', rank: 4, points: 4, normalized: 'gone with the wind' },
      { text: 'From Here to Eternity', rank: 5, points: 5, normalized: 'from here to eternity' },
      { text: 'Forrest Gump', rank: 6, points: 6, normalized: 'forrest gump' },
      { text: 'Shakespeare in Love', rank: 7, points: 7, normalized: 'shakespeare in love' },
      { text: 'Chicago', rank: 8, points: 8, normalized: 'chicago' },
      { text: 'The Curious Case of Benjamin Button', rank: 9, points: 9, normalized: 'the curious case of benjamin button', aliases: ['benjamin button'] },
      { text: 'Mary Poppins', rank: 10, points: 10, normalized: 'mary poppins' }
    ]
  },
  {
    id: 'movies-20',
    category: 'Movies',
    title: 'Top 10 highest-grossing directors of all time',
    difficulty: 'hard',
    answers: [
      { text: 'Steven Spielberg', rank: 1, points: 1, normalized: 'steven spielberg', aliases: ['spielberg'] },
      { text: 'James Cameron', rank: 2, points: 2, normalized: 'james cameron', aliases: ['cameron'] },
      { text: 'Russo Brothers', rank: 3, points: 3, normalized: 'russo brothers', aliases: ['anthony russo', 'joe russo'] },
      { text: 'Peter Jackson', rank: 4, points: 4, normalized: 'peter jackson', aliases: ['jackson'] },
      { text: 'Michael Bay', rank: 5, points: 5, normalized: 'michael bay', aliases: ['bay'] },
      { text: 'Christopher Nolan', rank: 6, points: 6, normalized: 'christopher nolan', aliases: ['nolan'] },
      { text: 'James Wan', rank: 7, points: 7, normalized: 'james wan', aliases: ['wan'] },
      { text: 'David Yates', rank: 8, points: 8, normalized: 'david yates', aliases: ['yates'] },
      { text: 'Tim Burton', rank: 9, points: 9, normalized: 'tim burton', aliases: ['burton'] },
      { text: 'Ridley Scott', rank: 10, points: 10, normalized: 'ridley scott', aliases: ['scott'] }
    ]
  },
  {
    id: 'movies-21',
    category: 'Movies',
    title: 'Top 10 highest-grossing Disney live-action remakes',
    difficulty: 'medium',
    answers: [
      { text: 'The Lion King', rank: 1, points: 1, normalized: 'the lion king', aliases: ['lion king 2019'] },
      { text: 'Beauty and the Beast', rank: 2, points: 2, normalized: 'beauty and the beast' },
      { text: 'Aladdin', rank: 3, points: 3, normalized: 'aladdin', aliases: ['aladdin 2019'] },
      { text: 'Alice in Wonderland', rank: 4, points: 4, normalized: 'alice in wonderland' },
      { text: 'The Jungle Book', rank: 5, points: 5, normalized: 'the jungle book', aliases: ['jungle book 2016'] },
      { text: 'Maleficent', rank: 6, points: 6, normalized: 'maleficent' },
      { text: 'Mufasa: The Lion King', rank: 7, points: 7, normalized: 'mufasa the lion king', aliases: ['mufasa'] },
      { text: 'The Little Mermaid', rank: 8, points: 8, normalized: 'the little mermaid', aliases: ['little mermaid 2023'] },
      { text: 'Cinderella', rank: 9, points: 9, normalized: 'cinderella', aliases: ['cinderella 2015'] },
      { text: 'Maleficent: Mistress of Evil', rank: 10, points: 10, normalized: 'maleficent mistress of evil', aliases: ['maleficent 2'] }
    ]
  },
  {
    id: 'movies-22',
    category: 'Movies',
    title: 'Top 10 longest mainstream movies by runtime',
    difficulty: 'hard',
    answers: [
      { text: 'Gone with the Wind', rank: 1, points: 1, normalized: 'gone with the wind' },
      { text: 'Lawrence of Arabia', rank: 2, points: 2, normalized: 'lawrence of arabia' },
      { text: 'The Ten Commandments', rank: 3, points: 3, normalized: 'the ten commandments' },
      { text: 'Ben-Hur', rank: 4, points: 4, normalized: 'ben-hur', aliases: ['ben hur'] },
      { text: 'Killers of the Flower Moon', rank: 5, points: 5, normalized: 'killers of the flower moon' },
      { text: 'The Godfather Part II', rank: 6, points: 6, normalized: 'the godfather part ii', aliases: ['godfather 2'] },
      { text: 'The Lord of the Rings: The Return of the King', rank: 7, points: 7, normalized: 'the lord of the rings the return of the king', aliases: ['return of the king'] },
      { text: 'Schindler\'s List', rank: 8, points: 8, normalized: 'schindlers list' },
      { text: 'Titanic', rank: 9, points: 9, normalized: 'titanic' },
      { text: 'Oppenheimer', rank: 10, points: 10, normalized: 'oppenheimer' }
    ]
  },

  // Music Category
  {
    id: 'music-1',
    category: 'Music',
    title: 'Top 10 best-selling albums of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Thriller - Michael Jackson', rank: 1, points: 1, normalized: 'thriller', aliases: ['thriller michael jackson', 'michael jackson thriller'] },
      { text: 'Back in Black - AC/DC', rank: 2, points: 2, normalized: 'back in black', aliases: ['back in black acdc', 'acdc back in black'] },
      { text: 'The Bodyguard Soundtrack', rank: 3, points: 3, normalized: 'the bodyguard soundtrack', aliases: ['bodyguard', 'bodyguard soundtrack'] },
      { text: 'Their Greatest Hits (1971-1975) - Eagles', rank: 4, points: 4, normalized: 'their greatest hits eagles', aliases: ['eagles greatest hits', 'eagles'] },
      { text: 'The Dark Side of the Moon - Pink Floyd', rank: 5, points: 5, normalized: 'the dark side of the moon', aliases: ['dark side of the moon', 'pink floyd dark side'] },
      { text: 'Bat Out of Hell - Meat Loaf', rank: 6, points: 6, normalized: 'bat out of hell', aliases: ['bat out of hell meat loaf', 'meat loaf'] },
      { text: 'Saturday Night Fever Soundtrack', rank: 7, points: 7, normalized: 'saturday night fever soundtrack', aliases: ['saturday night fever'] },
      { text: 'Come On Over - Shania Twain', rank: 8, points: 8, normalized: 'come on over', aliases: ['come on over shania twain', 'shania twain'] },
      { text: 'Rumours - Fleetwood Mac', rank: 9, points: 9, normalized: 'rumours', aliases: ['rumours fleetwood mac', 'fleetwood mac'] },
      { text: 'Led Zeppelin IV - Led Zeppelin', rank: 10, points: 10, normalized: 'led zeppelin iv', aliases: ['led zeppelin 4', 'zoso', 'led zeppelin'] }
    ]
  },
  {
    id: 'music-2',
    category: 'Music',
    title: 'Top 10 most streamed songs on Spotify',
    difficulty: 'easy',
    answers: [
      { text: 'Blinding Lights - The Weeknd', rank: 1, points: 1, normalized: 'blinding lights', aliases: ['blinding lights the weeknd'] },
      { text: 'Shape of You - Ed Sheeran', rank: 2, points: 2, normalized: 'shape of you', aliases: ['shape of you ed sheeran'] },
      { text: 'Someone You Loved - Lewis Capaldi', rank: 3, points: 3, normalized: 'someone you loved', aliases: ['someone you loved lewis capaldi'] },
      { text: 'Sunflower - Post Malone & Swae Lee', rank: 4, points: 4, normalized: 'sunflower', aliases: ['sunflower post malone'] },
      { text: 'Dance Monkey - Tones and I', rank: 5, points: 5, normalized: 'dance monkey', aliases: ['dance monkey tones and i'] },
      { text: 'Starboy - The Weeknd', rank: 6, points: 6, normalized: 'starboy', aliases: ['starboy the weeknd'] },
      { text: 'One Dance - Drake', rank: 7, points: 7, normalized: 'one dance', aliases: ['one dance drake'] },
      { text: 'Rockstar - Post Malone', rank: 8, points: 8, normalized: 'rockstar', aliases: ['rockstar post malone'] },
      { text: 'Closer - The Chainsmokers', rank: 9, points: 9, normalized: 'closer', aliases: ['closer chainsmokers'] },
      { text: 'As It Was - Harry Styles', rank: 10, points: 10, normalized: 'as it was', aliases: ['as it was harry styles'] }
    ]
  },
  {
    id: 'music-3',
    category: 'Music',
    title: 'Top 10 most awarded artists at the Grammys',
    difficulty: 'hard',
    answers: [
      { text: 'Beyoncé', rank: 1, points: 1, normalized: 'beyonce', aliases: ['beyoncé'] },
      { text: 'Georg Solti', rank: 2, points: 2, normalized: 'georg solti', aliases: ['solti'] },
      { text: 'Quincy Jones', rank: 3, points: 3, normalized: 'quincy jones', aliases: ['quincy'] },
      { text: 'Alison Krauss', rank: 4, points: 4, normalized: 'alison krauss', aliases: ['krauss'] },
      { text: 'Chick Corea', rank: 5, points: 5, normalized: 'chick corea', aliases: ['corea'] },
      { text: 'Pierre Boulez', rank: 6, points: 6, normalized: 'pierre boulez', aliases: ['boulez'] },
      { text: 'Vladimir Horowitz', rank: 7, points: 7, normalized: 'vladimir horowitz', aliases: ['horowitz'] },
      { text: 'Stevie Wonder', rank: 8, points: 8, normalized: 'stevie wonder', aliases: ['wonder'] },
      { text: 'John Williams', rank: 9, points: 9, normalized: 'john williams', aliases: ['williams'] },
      { text: 'Pat Metheny', rank: 10, points: 10, normalized: 'pat metheny', aliases: ['metheny'] }
    ]
  },
  {
    id: 'music-4',
    category: 'Music',
    title: 'Top 10 highest paid musicians',
    difficulty: 'medium',
    answers: [
      { text: 'Taylor Swift', rank: 1, points: 1, normalized: 'taylor swift', aliases: ['swift'] },
      { text: 'Beyoncé', rank: 2, points: 2, normalized: 'beyonce', aliases: ['beyoncé'] },
      { text: 'Bruce Springsteen', rank: 3, points: 3, normalized: 'bruce springsteen', aliases: ['springsteen', 'the boss'] },
      { text: 'Drake', rank: 4, points: 4, normalized: 'drake' },
      { text: 'Ed Sheeran', rank: 5, points: 5, normalized: 'ed sheeran', aliases: ['sheeran'] },
      { text: 'The Weeknd', rank: 6, points: 6, normalized: 'the weeknd', aliases: ['weeknd', 'abel tesfaye'] },
      { text: 'Bad Bunny', rank: 7, points: 7, normalized: 'bad bunny', aliases: ['benito'] },
      { text: 'Coldplay', rank: 8, points: 8, normalized: 'coldplay' },
      { text: 'Elton John', rank: 9, points: 9, normalized: 'elton john', aliases: ['elton'] },
      { text: 'Adele', rank: 10, points: 10, normalized: 'adele' }
    ]
  },
  {
    id: 'music-5',
    category: 'Music',
    title: 'Top 10 most popular music genres worldwide',
    difficulty: 'easy',
    answers: [
      { text: 'Pop', rank: 1, points: 1, normalized: 'pop' },
      { text: 'Hip Hop/Rap', rank: 2, points: 2, normalized: 'hip hop', aliases: ['rap', 'hip-hop', 'hiphop'] },
      { text: 'Rock', rank: 3, points: 3, normalized: 'rock' },
      { text: 'Electronic/Dance', rank: 4, points: 4, normalized: 'electronic', aliases: ['dance', 'edm', 'electronic dance'] },
      { text: 'R&B/Soul', rank: 5, points: 5, normalized: 'r&b', aliases: ['rnb', 'soul', 'rhythm and blues'] },
      { text: 'Country', rank: 6, points: 6, normalized: 'country' },
      { text: 'Latin', rank: 7, points: 7, normalized: 'latin', aliases: ['reggaeton', 'latin pop'] },
      { text: 'Jazz', rank: 8, points: 8, normalized: 'jazz' },
      { text: 'Classical', rank: 9, points: 9, normalized: 'classical' },
      { text: 'Blues', rank: 10, points: 10, normalized: 'blues' }
    ]
  },
  {
    id: 'music-6',
    category: 'Music',
    title: 'Top 10 most followed artists on Spotify',
    difficulty: 'medium',
    answers: [
      { text: 'The Weeknd', rank: 1, points: 1, normalized: 'the weeknd', aliases: ['weeknd', 'abel tesfaye'] },
      { text: 'Taylor Swift', rank: 2, points: 2, normalized: 'taylor swift', aliases: ['swift'] },
      { text: 'Ed Sheeran', rank: 3, points: 3, normalized: 'ed sheeran', aliases: ['sheeran'] },
      { text: 'Ariana Grande', rank: 4, points: 4, normalized: 'ariana grande', aliases: ['ariana', 'ari'] },
      { text: 'Bad Bunny', rank: 5, points: 5, normalized: 'bad bunny', aliases: ['benito'] },
      { text: 'Drake', rank: 6, points: 6, normalized: 'drake' },
      { text: 'Billie Eilish', rank: 7, points: 7, normalized: 'billie eilish', aliases: ['billie'] },
      { text: 'Justin Bieber', rank: 8, points: 8, normalized: 'justin bieber', aliases: ['bieber', 'jb'] },
      { text: 'Rihanna', rank: 9, points: 9, normalized: 'rihanna', aliases: ['riri'] },
      { text: 'Eminem', rank: 10, points: 10, normalized: 'eminem', aliases: ['slim shady', 'marshall mathers'] }
    ]
  },
  {
    id: 'music-7',
    category: 'Music',
    title: 'Top 10 most streamed artists on Spotify (all-time)',
    difficulty: 'medium',
    answers: [
      { text: 'Drake', rank: 1, points: 1, normalized: 'drake' },
      { text: 'Bad Bunny', rank: 2, points: 2, normalized: 'bad bunny', aliases: ['benito'] },
      { text: 'The Weeknd', rank: 3, points: 3, normalized: 'the weeknd', aliases: ['weeknd'] },
      { text: 'Taylor Swift', rank: 4, points: 4, normalized: 'taylor swift', aliases: ['swift'] },
      { text: 'Ed Sheeran', rank: 5, points: 5, normalized: 'ed sheeran', aliases: ['sheeran'] },
      { text: 'Post Malone', rank: 6, points: 6, normalized: 'post malone', aliases: ['posty'] },
      { text: 'Justin Bieber', rank: 7, points: 7, normalized: 'justin bieber', aliases: ['bieber'] },
      { text: 'Ariana Grande', rank: 8, points: 8, normalized: 'ariana grande', aliases: ['ariana'] },
      { text: 'Eminem', rank: 9, points: 9, normalized: 'eminem', aliases: ['slim shady'] },
      { text: 'Kanye West', rank: 10, points: 10, normalized: 'kanye west', aliases: ['kanye', 'ye'] }
    ]
  },
  {
    id: 'music-8',
    category: 'Music',
    title: 'Top 10 most viewed music videos on YouTube',
    difficulty: 'easy',
    answers: [
      { text: 'Baby Shark Dance - Pinkfong', rank: 1, points: 1, normalized: 'baby shark', aliases: ['baby shark dance', 'pinkfong'] },
      { text: 'Despacito - Luis Fonsi ft. Daddy Yankee', rank: 2, points: 2, normalized: 'despacito', aliases: ['despacito luis fonsi'] },
      { text: 'Shape of You - Ed Sheeran', rank: 3, points: 3, normalized: 'shape of you', aliases: ['shape of you ed sheeran'] },
      { text: 'See You Again - Wiz Khalifa ft. Charlie Puth', rank: 4, points: 4, normalized: 'see you again', aliases: ['see you again wiz khalifa'] },
      { text: 'Gangnam Style - PSY', rank: 5, points: 5, normalized: 'gangnam style', aliases: ['gangnam style psy'] },
      { text: 'Uptown Funk - Mark Ronson ft. Bruno Mars', rank: 6, points: 6, normalized: 'uptown funk', aliases: ['uptown funk bruno mars'] },
      { text: 'Sugar - Maroon 5', rank: 7, points: 7, normalized: 'sugar', aliases: ['sugar maroon 5'] },
      { text: 'Sorry - Justin Bieber', rank: 8, points: 8, normalized: 'sorry', aliases: ['sorry justin bieber'] },
      { text: 'Counting Stars - OneRepublic', rank: 9, points: 9, normalized: 'counting stars', aliases: ['counting stars onerepublic'] },
      { text: 'Waka Waka - Shakira', rank: 10, points: 10, normalized: 'waka waka', aliases: ['waka waka shakira', 'this time for africa'] }
    ]
  },
  {
    id: 'music-9',
    category: 'Music',
    title: 'Top 10 artists with most #1 hits on Billboard Hot 100',
    difficulty: 'hard',
    answers: [
      { text: 'The Beatles', rank: 1, points: 1, normalized: 'the beatles', aliases: ['beatles'] },
      { text: 'Mariah Carey', rank: 2, points: 2, normalized: 'mariah carey', aliases: ['mariah'] },
      { text: 'Elvis Presley', rank: 3, points: 3, normalized: 'elvis presley', aliases: ['elvis', 'the king'] },
      { text: 'Rihanna', rank: 4, points: 4, normalized: 'rihanna', aliases: ['riri'] },
      { text: 'Michael Jackson', rank: 5, points: 5, normalized: 'michael jackson', aliases: ['mj', 'king of pop'] },
      { text: 'Madonna', rank: 6, points: 6, normalized: 'madonna' },
      { text: 'The Supremes', rank: 7, points: 7, normalized: 'the supremes', aliases: ['supremes'] },
      { text: 'Drake', rank: 8, points: 8, normalized: 'drake' },
      { text: 'Whitney Houston', rank: 9, points: 9, normalized: 'whitney houston', aliases: ['whitney'] },
      { text: 'Stevie Wonder', rank: 10, points: 10, normalized: 'stevie wonder' }
    ]
  },
  {
    id: 'music-10',
    category: 'Music',
    title: 'Top 10 songs with most weeks at #1 on Billboard Hot 100',
    difficulty: 'hard',
    answers: [
      { text: 'Old Town Road - Lil Nas X', rank: 1, points: 1, normalized: 'old town road', aliases: ['old town road lil nas x'] },
      { text: 'One Sweet Day - Mariah Carey & Boyz II Men', rank: 2, points: 2, normalized: 'one sweet day', aliases: ['one sweet day mariah carey'] },
      { text: 'Despacito - Luis Fonsi ft. Daddy Yankee', rank: 3, points: 3, normalized: 'despacito', aliases: ['despacito luis fonsi'] },
      { text: 'Uptown Funk - Mark Ronson ft. Bruno Mars', rank: 4, points: 4, normalized: 'uptown funk', aliases: ['uptown funk bruno mars'] },
      { text: 'I Will Always Love You - Whitney Houston', rank: 5, points: 5, normalized: 'i will always love you', aliases: ['i will always love you whitney houston'] },
      { text: 'Candle in the Wind 1997 - Elton John', rank: 6, points: 6, normalized: 'candle in the wind', aliases: ['candle in the wind elton john'] },
      { text: 'I Gotta Feeling - Black Eyed Peas', rank: 7, points: 7, normalized: 'i gotta feeling', aliases: ['i gotta feeling black eyed peas'] },
      { text: 'We Belong Together - Mariah Carey', rank: 8, points: 8, normalized: 'we belong together', aliases: ['we belong together mariah carey'] },
      { text: 'End of the Road - Boyz II Men', rank: 9, points: 9, normalized: 'end of the road', aliases: ['end of the road boyz ii men'] },
      { text: 'Smooth - Santana ft. Rob Thomas', rank: 10, points: 10, normalized: 'smooth', aliases: ['smooth santana'] }
    ]
  },
  {
    id: 'music-11',
    category: 'Music',
    title: 'Top 10 highest-grossing concert tours of all time',
    difficulty: 'hard',
    answers: [
      { text: 'The Eras Tour - Taylor Swift', rank: 1, points: 1, normalized: 'the eras tour', aliases: ['eras tour', 'taylor swift eras tour'] },
      { text: 'Music of the Spheres Tour - Coldplay', rank: 2, points: 2, normalized: 'music of the spheres tour', aliases: ['coldplay tour'] },
      { text: 'Farewell Yellow Brick Road - Elton John', rank: 3, points: 3, normalized: 'farewell yellow brick road', aliases: ['elton john tour', 'elton john farewell'] },
      { text: 'Mathematics Tour - Ed Sheeran', rank: 4, points: 4, normalized: 'mathematics tour', aliases: ['ed sheeran mathematics tour'] },
      { text: '÷ (Divide) Tour - Ed Sheeran', rank: 5, points: 5, normalized: 'divide tour', aliases: ['ed sheeran divide tour'] },
      { text: 'U2 360° Tour - U2', rank: 6, points: 6, normalized: 'u2 360 tour', aliases: ['u2 360'] },
      { text: 'Love On Tour - Harry Styles', rank: 7, points: 7, normalized: 'love on tour', aliases: ['harry styles tour'] },
      { text: 'Renaissance World Tour - Beyoncé', rank: 8, points: 8, normalized: 'renaissance world tour', aliases: ['beyonce renaissance tour'] },
      { text: 'A Bigger Bang Tour - Rolling Stones', rank: 9, points: 9, normalized: 'a bigger bang tour', aliases: ['rolling stones tour'] },
      { text: 'The Wall Live - Roger Waters', rank: 10, points: 10, normalized: 'the wall live', aliases: ['roger waters the wall'] }
    ]
  },
  {
    id: 'music-12',
    category: 'Music',
    title: 'Top 10 best-selling K-pop groups of all time',
    difficulty: 'medium',
    answers: [
      { text: 'BTS', rank: 1, points: 1, normalized: 'bts', aliases: ['bangtan sonyeondan', 'bangtan boys'] },
      { text: 'SEVENTEEN', rank: 2, points: 2, normalized: 'seventeen', aliases: ['svt'] },
      { text: 'Stray Kids', rank: 3, points: 3, normalized: 'stray kids', aliases: ['skz'] },
      { text: 'EXO', rank: 4, points: 4, normalized: 'exo' },
      { text: 'NCT', rank: 5, points: 5, normalized: 'nct', aliases: ['nct 127', 'nct dream'] },
      { text: 'BLACKPINK', rank: 6, points: 6, normalized: 'blackpink', aliases: ['bp'] },
      { text: 'TWICE', rank: 7, points: 7, normalized: 'twice' },
      { text: 'TXT', rank: 8, points: 8, normalized: 'txt', aliases: ['tomorrow x together'] },
      { text: 'ENHYPEN', rank: 9, points: 9, normalized: 'enhypen' },
      { text: 'aespa', rank: 10, points: 10, normalized: 'aespa' }
    ]
  },
  {
    id: 'music-13',
    category: 'Music',
    title: 'Top 10 most streamed rap artists on Spotify',
    difficulty: 'medium',
    answers: [
      { text: 'Drake', rank: 1, points: 1, normalized: 'drake' },
      { text: 'Eminem', rank: 2, points: 2, normalized: 'eminem', aliases: ['slim shady'] },
      { text: 'Post Malone', rank: 3, points: 3, normalized: 'post malone', aliases: ['posty'] },
      { text: 'Kanye West', rank: 4, points: 4, normalized: 'kanye west', aliases: ['kanye', 'ye'] },
      { text: 'Travis Scott', rank: 5, points: 5, normalized: 'travis scott', aliases: ['la flame'] },
      { text: 'Juice WRLD', rank: 6, points: 6, normalized: 'juice wrld', aliases: ['juice world'] },
      { text: 'XXXTentacion', rank: 7, points: 7, normalized: 'xxxtentacion', aliases: ['xxx', 'x'] },
      { text: 'Kendrick Lamar', rank: 8, points: 8, normalized: 'kendrick lamar', aliases: ['kendrick', 'k dot'] },
      { text: 'Future', rank: 9, points: 9, normalized: 'future' },
      { text: '21 Savage', rank: 10, points: 10, normalized: '21 savage' }
    ]
  },
  {
    id: 'music-14',
    category: 'Music',
    title: 'Top 10 Latin music artists by Spotify streams',
    difficulty: 'medium',
    answers: [
      { text: 'Bad Bunny', rank: 1, points: 1, normalized: 'bad bunny', aliases: ['benito'] },
      { text: 'J Balvin', rank: 2, points: 2, normalized: 'j balvin', aliases: ['balvin'] },
      { text: 'Daddy Yankee', rank: 3, points: 3, normalized: 'daddy yankee' },
      { text: 'Ozuna', rank: 4, points: 4, normalized: 'ozuna' },
      { text: 'Shakira', rank: 5, points: 5, normalized: 'shakira' },
      { text: 'Karol G', rank: 6, points: 6, normalized: 'karol g' },
      { text: 'Maluma', rank: 7, points: 7, normalized: 'maluma' },
      { text: 'Anuel AA', rank: 8, points: 8, normalized: 'anuel aa', aliases: ['anuel'] },
      { text: 'Rauw Alejandro', rank: 9, points: 9, normalized: 'rauw alejandro', aliases: ['rauw'] },
      { text: 'Peso Pluma', rank: 10, points: 10, normalized: 'peso pluma' }
    ]
  },
  {
    id: 'music-15',
    category: 'Music',
    title: 'Top 10 most streamed female artists on Spotify',
    difficulty: 'easy',
    answers: [
      { text: 'Taylor Swift', rank: 1, points: 1, normalized: 'taylor swift', aliases: ['swift'] },
      { text: 'Ariana Grande', rank: 2, points: 2, normalized: 'ariana grande', aliases: ['ariana', 'ari'] },
      { text: 'Billie Eilish', rank: 3, points: 3, normalized: 'billie eilish', aliases: ['billie'] },
      { text: 'Rihanna', rank: 4, points: 4, normalized: 'rihanna', aliases: ['riri'] },
      { text: 'Dua Lipa', rank: 5, points: 5, normalized: 'dua lipa', aliases: ['dua'] },
      { text: 'Shakira', rank: 6, points: 6, normalized: 'shakira' },
      { text: 'Karol G', rank: 7, points: 7, normalized: 'karol g' },
      { text: 'SZA', rank: 8, points: 8, normalized: 'sza' },
      { text: 'Doja Cat', rank: 9, points: 9, normalized: 'doja cat', aliases: ['doja'] },
      { text: 'Olivia Rodrigo', rank: 10, points: 10, normalized: 'olivia rodrigo', aliases: ['olivia'] }
    ]
  },
  {
    id: 'music-16',
    category: 'Music',
    title: 'Top 10 best-selling music artists of all time',
    difficulty: 'medium',
    answers: [
      { text: 'The Beatles', rank: 1, points: 1, normalized: 'the beatles', aliases: ['beatles'] },
      { text: 'Elvis Presley', rank: 2, points: 2, normalized: 'elvis presley', aliases: ['elvis', 'the king'] },
      { text: 'Michael Jackson', rank: 3, points: 3, normalized: 'michael jackson', aliases: ['mj', 'king of pop'] },
      { text: 'Elton John', rank: 4, points: 4, normalized: 'elton john', aliases: ['elton'] },
      { text: 'Madonna', rank: 5, points: 5, normalized: 'madonna' },
      { text: 'Led Zeppelin', rank: 6, points: 6, normalized: 'led zeppelin', aliases: ['zeppelin'] },
      { text: 'Rihanna', rank: 7, points: 7, normalized: 'rihanna', aliases: ['riri'] },
      { text: 'Pink Floyd', rank: 8, points: 8, normalized: 'pink floyd' },
      { text: 'Eminem', rank: 9, points: 9, normalized: 'eminem', aliases: ['slim shady'] },
      { text: 'Mariah Carey', rank: 10, points: 10, normalized: 'mariah carey', aliases: ['mariah'] }
    ]
  },
  {
    id: 'music-17',
    category: 'Music',
    title: 'Top 10 biggest TikTok viral songs of all time',
    difficulty: 'easy',
    answers: [
      { text: 'Old Town Road - Lil Nas X', rank: 1, points: 1, normalized: 'old town road', aliases: ['old town road lil nas x'] },
      { text: 'Say So - Doja Cat', rank: 2, points: 2, normalized: 'say so', aliases: ['say so doja cat'] },
      { text: 'drivers license - Olivia Rodrigo', rank: 3, points: 3, normalized: 'drivers license', aliases: ['drivers license olivia rodrigo'] },
      { text: 'Savage - Megan Thee Stallion', rank: 4, points: 4, normalized: 'savage', aliases: ['savage megan thee stallion'] },
      { text: 'Lottery (Renegade) - K CAMP', rank: 5, points: 5, normalized: 'lottery', aliases: ['renegade', 'lottery k camp'] },
      { text: 'Blinding Lights - The Weeknd', rank: 6, points: 6, normalized: 'blinding lights', aliases: ['blinding lights weeknd'] },
      { text: 'WAP - Cardi B ft. Megan Thee Stallion', rank: 7, points: 7, normalized: 'wap', aliases: ['wap cardi b'] },
      { text: 'abcdefu - GAYLE', rank: 8, points: 8, normalized: 'abcdefu', aliases: ['abcdefu gayle'] },
      { text: 'Cupid (Twin Ver.) - FIFTY FIFTY', rank: 9, points: 9, normalized: 'cupid', aliases: ['cupid fifty fifty'] },
      { text: 'Montero (Call Me By Your Name) - Lil Nas X', rank: 10, points: 10, normalized: 'montero', aliases: ['call me by your name', 'montero lil nas x'] }
    ]
  },
  {
    id: 'music-18',
    category: 'Music',
    title: 'Top 10 most streamed Spotify songs released in 2024',
    difficulty: 'easy',
    answers: [
      { text: 'Espresso - Sabrina Carpenter', rank: 1, points: 1, normalized: 'espresso', aliases: ['espresso sabrina carpenter'] },
      { text: 'Beautiful Things - Benson Boone', rank: 2, points: 2, normalized: 'beautiful things', aliases: ['beautiful things benson boone'] },
      { text: 'Birds of a Feather - Billie Eilish', rank: 3, points: 3, normalized: 'birds of a feather', aliases: ['birds of a feather billie eilish'] },
      { text: 'Gata Only - FloyyMenor & Cris MJ', rank: 4, points: 4, normalized: 'gata only', aliases: ['gata only floyymenor'] },
      { text: 'Lose Control - Teddy Swims', rank: 5, points: 5, normalized: 'lose control', aliases: ['lose control teddy swims'] },
      { text: 'Not Like Us - Kendrick Lamar', rank: 6, points: 6, normalized: 'not like us', aliases: ['not like us kendrick'] },
      { text: 'Too Sweet - Hozier', rank: 7, points: 7, normalized: 'too sweet', aliases: ['too sweet hozier'] },
      { text: 'Die With A Smile - Lady Gaga & Bruno Mars', rank: 8, points: 8, normalized: 'die with a smile', aliases: ['die with a smile lady gaga bruno mars'] },
      { text: 'Taste - Sabrina Carpenter', rank: 9, points: 9, normalized: 'taste', aliases: ['taste sabrina carpenter'] },
      { text: 'Please Please Please - Sabrina Carpenter', rank: 10, points: 10, normalized: 'please please please', aliases: ['please please please sabrina carpenter'] }
    ]
  },
  {
    id: 'music-19',
    category: 'Music',
    title: 'Top 10 Spotify Wrapped most-streamed artists globally in 2024',
    difficulty: 'easy',
    answers: [
      { text: 'Taylor Swift', rank: 1, points: 1, normalized: 'taylor swift', aliases: ['swift'] },
      { text: 'The Weeknd', rank: 2, points: 2, normalized: 'the weeknd', aliases: ['weeknd'] },
      { text: 'Bad Bunny', rank: 3, points: 3, normalized: 'bad bunny', aliases: ['benito'] },
      { text: 'Drake', rank: 4, points: 4, normalized: 'drake' },
      { text: 'Billie Eilish', rank: 5, points: 5, normalized: 'billie eilish', aliases: ['billie'] },
      { text: 'Travis Scott', rank: 6, points: 6, normalized: 'travis scott', aliases: ['la flame'] },
      { text: 'Sabrina Carpenter', rank: 7, points: 7, normalized: 'sabrina carpenter', aliases: ['sabrina'] },
      { text: 'Kanye West', rank: 8, points: 8, normalized: 'kanye west', aliases: ['kanye', 'ye'] },
      { text: 'Ariana Grande', rank: 9, points: 9, normalized: 'ariana grande', aliases: ['ariana'] },
      { text: 'Bruno Mars', rank: 10, points: 10, normalized: 'bruno mars', aliases: ['bruno'] }
    ]
  },
  {
    id: 'music-20',
    category: 'Music',
    title: 'Top 10 best-selling digital singles of all time',
    difficulty: 'hard',
    answers: [
      { text: 'Old Town Road - Lil Nas X', rank: 1, points: 1, normalized: 'old town road', aliases: ['old town road lil nas x'] },
      { text: 'Despacito - Luis Fonsi ft. Daddy Yankee', rank: 2, points: 2, normalized: 'despacito', aliases: ['despacito luis fonsi'] },
      { text: 'Shape of You - Ed Sheeran', rank: 3, points: 3, normalized: 'shape of you', aliases: ['shape of you ed sheeran'] },
      { text: 'See You Again - Wiz Khalifa ft. Charlie Puth', rank: 4, points: 4, normalized: 'see you again', aliases: ['see you again wiz khalifa'] },
      { text: 'Uptown Funk - Mark Ronson ft. Bruno Mars', rank: 5, points: 5, normalized: 'uptown funk', aliases: ['uptown funk bruno mars'] },
      { text: 'Thinking Out Loud - Ed Sheeran', rank: 6, points: 6, normalized: 'thinking out loud', aliases: ['thinking out loud ed sheeran'] },
      { text: 'Closer - The Chainsmokers', rank: 7, points: 7, normalized: 'closer', aliases: ['closer chainsmokers'] },
      { text: 'Lean On - Major Lazer & DJ Snake', rank: 8, points: 8, normalized: 'lean on', aliases: ['lean on major lazer'] },
      { text: 'Blinding Lights - The Weeknd', rank: 9, points: 9, normalized: 'blinding lights', aliases: ['blinding lights weeknd'] },
      { text: 'Somebody That I Used to Know - Gotye', rank: 10, points: 10, normalized: 'somebody that i used to know', aliases: ['gotye'] }
    ]
  },

  // Science Category
  {
    id: 'science-1',
    category: 'Science',
    title: 'Top 10 most important scientific discoveries',
    difficulty: 'hard',
    answers: [
      { text: 'Theory of Relativity', rank: 1, points: 1 },
      { text: 'DNA Structure', rank: 2, points: 2 },
      { text: 'Penicillin', rank: 3, points: 3 },
      { text: 'Gravity', rank: 4, points: 4 },
      { text: 'Evolution by Natural Selection', rank: 5, points: 5 },
      { text: 'Quantum Mechanics', rank: 6, points: 6 },
      { text: 'Vaccination', rank: 7, points: 7 },
      { text: 'Electricity', rank: 8, points: 8 },
      { text: 'Periodic Table', rank: 9, points: 9 },
      { text: 'Germ Theory', rank: 10, points: 10 }
    ]
  },
  {
    id: 'science-2',
    category: 'Science',
    title: 'Top 10 largest planets in our solar system',
    difficulty: 'medium',
    answers: [
      { text: 'Jupiter', rank: 1, points: 1 },
      { text: 'Saturn', rank: 2, points: 2 },
      { text: 'Uranus', rank: 3, points: 3 },
      { text: 'Neptune', rank: 4, points: 4 },
      { text: 'Earth', rank: 5, points: 5 },
      { text: 'Venus', rank: 6, points: 6 },
      { text: 'Mars', rank: 7, points: 7 },
      { text: 'Mercury', rank: 8, points: 8 },
      { text: 'Pluto (dwarf planet)', rank: 9, points: 9 },
      { text: 'Eris (dwarf planet)', rank: 10, points: 10 }
    ]
  },
  {
    id: 'science-3',
    category: 'Science',
    title: 'Top 10 most endangered animal species',
    difficulty: 'medium',
    answers: [
      { text: 'Javan Rhino', rank: 1, points: 1 },
      { text: 'Vaquita', rank: 2, points: 2 },
      { text: 'Sumatran Rhino', rank: 3, points: 3 },
      { text: 'Amur Leopard', rank: 4, points: 4 },
      { text: 'Mountain Gorilla', rank: 5, points: 5 },
      { text: 'South China Tiger', rank: 6, points: 6 },
      { text: 'Sumatran Elephant', rank: 7, points: 7 },
      { text: 'Bornean Orangutan', rank: 8, points: 8 },
      { text: 'Hawksbill Sea Turtle', rank: 9, points: 9 },
      { text: 'Black Rhino', rank: 10, points: 10 }
    ]
  },
  {
    id: 'science-4',
    category: 'Science',
    title: 'Top 10 most important inventions of the 20th century',
    difficulty: 'medium',
    answers: [
      { text: 'Internet', rank: 1, points: 1 },
      { text: 'Personal Computer', rank: 2, points: 2 },
      { text: 'Mobile Phone', rank: 3, points: 3 },
      { text: 'Television', rank: 4, points: 4 },
      { text: 'Airplane', rank: 5, points: 5 },
      { text: 'Penicillin', rank: 6, points: 6 },
      { text: 'Nuclear Power', rank: 7, points: 7 },
      { text: 'Space Travel', rank: 8, points: 8 },
      { text: 'DNA Sequencing', rank: 9, points: 9 },
      { text: 'Laser', rank: 10, points: 10 }
    ]
  },
  {
    id: 'science-5',
    category: 'Science',
    title: 'Top 10 smartest animals in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Chimpanzee', rank: 1, points: 1 },
      { text: 'Dolphin', rank: 2, points: 2 },
      { text: 'Elephant', rank: 3, points: 3 },
      { text: 'Octopus', rank: 4, points: 4 },
      { text: 'Crow', rank: 5, points: 5 },
      { text: 'Pig', rank: 6, points: 6 },
      { text: 'Dog', rank: 7, points: 7 },
      { text: 'Cat', rank: 8, points: 8 },
      { text: 'Horse', rank: 9, points: 9 },
      { text: 'Raccoon', rank: 10, points: 10 }
    ]
  },
  {
    id: 'science-6',
    category: 'Science',
    title: 'Top 10 fastest animals in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Peregrine Falcon', rank: 1, points: 1, normalized: 'peregrine falcon', aliases: ['falcon'] },
      { text: 'Golden Eagle', rank: 2, points: 2, normalized: 'golden eagle', aliases: ['eagle'] },
      { text: 'White-throated Needletail', rank: 3, points: 3, normalized: 'white-throated needletail', aliases: ['needletail', 'spine-tailed swift'] },
      { text: 'Mexican Free-tailed Bat', rank: 4, points: 4, normalized: 'mexican free-tailed bat', aliases: ['free-tailed bat'] },
      { text: 'Cheetah', rank: 5, points: 5, normalized: 'cheetah' },
      { text: 'Sailfish', rank: 6, points: 6, normalized: 'sailfish' },
      { text: 'Black Marlin', rank: 7, points: 7, normalized: 'black marlin', aliases: ['marlin'] },
      { text: 'Pronghorn Antelope', rank: 8, points: 8, normalized: 'pronghorn antelope', aliases: ['pronghorn'] },
      { text: 'Springbok', rank: 9, points: 9, normalized: 'springbok' },
      { text: 'Grey-headed Albatross', rank: 10, points: 10, normalized: 'grey-headed albatross', aliases: ['albatross', 'gray-headed albatross'] }
    ]
  },
  {
    id: 'science-7',
    category: 'Science',
    title: 'Top 10 largest organs in the human body',
    difficulty: 'medium',
    answers: [
      { text: 'Skin', rank: 1, points: 1, normalized: 'skin', aliases: [] },
      { text: 'Liver', rank: 2, points: 2, normalized: 'liver', aliases: [] },
      { text: 'Brain', rank: 3, points: 3, normalized: 'brain', aliases: [] },
      { text: 'Lungs', rank: 4, points: 4, normalized: 'lungs', aliases: ['lung'] },
      { text: 'Heart', rank: 5, points: 5, normalized: 'heart', aliases: [] },
      { text: 'Kidneys', rank: 6, points: 6, normalized: 'kidneys', aliases: ['kidney'] },
      { text: 'Spleen', rank: 7, points: 7, normalized: 'spleen', aliases: [] },
      { text: 'Pancreas', rank: 8, points: 8, normalized: 'pancreas', aliases: [] },
      { text: 'Thyroid', rank: 9, points: 9, normalized: 'thyroid', aliases: ['thyroid gland'] },
      { text: 'Joints', rank: 10, points: 10, normalized: 'joints', aliases: ['joint'] }
    ]
  },
  {
    id: 'science-8',
    category: 'Science',
    title: 'Top 10 most common elements in the human body by mass',
    difficulty: 'hard',
    answers: [
      { text: 'Oxygen', rank: 1, points: 1, normalized: 'oxygen', aliases: ['o'] },
      { text: 'Carbon', rank: 2, points: 2, normalized: 'carbon', aliases: ['c'] },
      { text: 'Hydrogen', rank: 3, points: 3, normalized: 'hydrogen', aliases: ['h'] },
      { text: 'Nitrogen', rank: 4, points: 4, normalized: 'nitrogen', aliases: ['n'] },
      { text: 'Calcium', rank: 5, points: 5, normalized: 'calcium', aliases: ['ca'] },
      { text: 'Phosphorus', rank: 6, points: 6, normalized: 'phosphorus', aliases: ['p'] },
      { text: 'Potassium', rank: 7, points: 7, normalized: 'potassium', aliases: ['k'] },
      { text: 'Sulfur', rank: 8, points: 8, normalized: 'sulfur', aliases: ['sulphur', 's'] },
      { text: 'Chlorine', rank: 9, points: 9, normalized: 'chlorine', aliases: ['cl'] },
      { text: 'Sodium', rank: 10, points: 10, normalized: 'sodium', aliases: ['na'] }
    ]
  },
  {
    id: 'science-9',
    category: 'Science',
    title: 'Top 10 chemical elements essential to human life',
    difficulty: 'hard',
    answers: [
      { text: 'Oxygen', rank: 1, points: 1, normalized: 'oxygen', aliases: ['o'] },
      { text: 'Carbon', rank: 2, points: 2, normalized: 'carbon', aliases: ['c'] },
      { text: 'Hydrogen', rank: 3, points: 3, normalized: 'hydrogen', aliases: ['h'] },
      { text: 'Nitrogen', rank: 4, points: 4, normalized: 'nitrogen', aliases: ['n'] },
      { text: 'Calcium', rank: 5, points: 5, normalized: 'calcium', aliases: ['ca'] },
      { text: 'Phosphorus', rank: 6, points: 6, normalized: 'phosphorus', aliases: ['p'] },
      { text: 'Potassium', rank: 7, points: 7, normalized: 'potassium', aliases: ['k'] },
      { text: 'Sulfur', rank: 8, points: 8, normalized: 'sulfur', aliases: ['sulphur', 's'] },
      { text: 'Sodium', rank: 9, points: 9, normalized: 'sodium', aliases: ['na'] },
      { text: 'Chlorine', rank: 10, points: 10, normalized: 'chlorine', aliases: ['cl'] }
    ]
  },
  {
    id: 'science-10',
    category: 'Science',
    title: 'Top 10 major human organ systems',
    difficulty: 'medium',
    answers: [
      { text: 'Integumentary system', rank: 1, points: 1, normalized: 'integumentary system', aliases: ['integumentary', 'skin system'] },
      { text: 'Skeletal system', rank: 2, points: 2, normalized: 'skeletal system', aliases: ['skeletal', 'skeleton'] },
      { text: 'Muscular system', rank: 3, points: 3, normalized: 'muscular system', aliases: ['muscular', 'muscles'] },
      { text: 'Nervous system', rank: 4, points: 4, normalized: 'nervous system', aliases: ['nervous', 'nerves'] },
      { text: 'Endocrine system', rank: 5, points: 5, normalized: 'endocrine system', aliases: ['endocrine', 'hormones'] },
      { text: 'Cardiovascular system', rank: 6, points: 6, normalized: 'cardiovascular system', aliases: ['cardiovascular', 'circulatory system', 'circulatory'] },
      { text: 'Respiratory system', rank: 7, points: 7, normalized: 'respiratory system', aliases: ['respiratory', 'breathing system'] },
      { text: 'Digestive system', rank: 8, points: 8, normalized: 'digestive system', aliases: ['digestive', 'gastrointestinal'] },
      { text: 'Urinary system', rank: 9, points: 9, normalized: 'urinary system', aliases: ['urinary', 'renal system'] },
      { text: 'Reproductive system', rank: 10, points: 10, normalized: 'reproductive system', aliases: ['reproductive'] }
    ]
  },
  {
    id: 'science-11',
    category: 'Science',
    title: 'Top 10 most abundant molecules in human cells',
    difficulty: 'hard',
    answers: [
      { text: 'Water', rank: 1, points: 1, normalized: 'water', aliases: ['h2o'] },
      { text: 'Proteins', rank: 2, points: 2, normalized: 'proteins', aliases: ['protein'] },
      { text: 'Lipids', rank: 3, points: 3, normalized: 'lipids', aliases: ['lipid', 'fats'] },
      { text: 'Carbohydrates', rank: 4, points: 4, normalized: 'carbohydrates', aliases: ['carbs', 'sugars'] },
      { text: 'DNA', rank: 5, points: 5, normalized: 'dna', aliases: ['deoxyribonucleic acid'] },
      { text: 'RNA', rank: 6, points: 6, normalized: 'rna', aliases: ['ribonucleic acid'] },
      { text: 'ATP', rank: 7, points: 7, normalized: 'atp', aliases: ['adenosine triphosphate'] },
      { text: 'Hemoglobin', rank: 8, points: 8, normalized: 'hemoglobin', aliases: ['haemoglobin'] },
      { text: 'Enzymes', rank: 9, points: 9, normalized: 'enzymes', aliases: ['enzyme'] },
      { text: 'Collagen', rank: 10, points: 10, normalized: 'collagen', aliases: [] }
    ]
  },
  {
    id: 'science-12',
    category: 'Science',
    title: 'Top 10 human senses or sensory systems',
    difficulty: 'medium',
    answers: [
      { text: 'Sight', rank: 1, points: 1, normalized: 'sight', aliases: ['vision', 'seeing'] },
      { text: 'Hearing', rank: 2, points: 2, normalized: 'hearing', aliases: ['audition', 'listening'] },
      { text: 'Smell', rank: 3, points: 3, normalized: 'smell', aliases: ['olfaction', 'smelling'] },
      { text: 'Taste', rank: 4, points: 4, normalized: 'taste', aliases: ['gustation', 'tasting'] },
      { text: 'Touch', rank: 5, points: 5, normalized: 'touch', aliases: ['tactile', 'feeling'] },
      { text: 'Proprioception (body position)', rank: 6, points: 6, normalized: 'proprioception', aliases: ['body position', 'kinesthesia'] },
      { text: 'Thermoception (temperature)', rank: 7, points: 7, normalized: 'thermoception', aliases: ['temperature sense', 'thermoreception'] },
      { text: 'Nociception (pain)', rank: 8, points: 8, normalized: 'nociception', aliases: ['pain', 'pain sense'] },
      { text: 'Equilibrioception (balance)', rank: 9, points: 9, normalized: 'equilibrioception', aliases: ['balance', 'vestibular sense'] },
      { text: 'Interoception (internal body awareness)', rank: 10, points: 10, normalized: 'interoception', aliases: ['internal body awareness', 'internal sense'] }
    ]
  },
  {
    id: 'science-13',
    category: 'Science',
    title: 'Top 10 elements most abundant in Earth\'s crust',
    difficulty: 'hard',
    answers: [
      { text: 'Oxygen', rank: 1, points: 1, normalized: 'oxygen', aliases: ['o'] },
      { text: 'Silicon', rank: 2, points: 2, normalized: 'silicon', aliases: ['si'] },
      { text: 'Aluminum', rank: 3, points: 3, normalized: 'aluminum', aliases: ['aluminium', 'al'] },
      { text: 'Iron', rank: 4, points: 4, normalized: 'iron', aliases: ['fe'] },
      { text: 'Calcium', rank: 5, points: 5, normalized: 'calcium', aliases: ['ca'] },
      { text: 'Sodium', rank: 6, points: 6, normalized: 'sodium', aliases: ['na'] },
      { text: 'Potassium', rank: 7, points: 7, normalized: 'potassium', aliases: ['k'] },
      { text: 'Magnesium', rank: 8, points: 8, normalized: 'magnesium', aliases: ['mg'] },
      { text: 'Titanium', rank: 9, points: 9, normalized: 'titanium', aliases: ['ti'] },
      { text: 'Hydrogen', rank: 10, points: 10, normalized: 'hydrogen', aliases: ['h'] }
    ]
  },

  // Geography Category
  {
    id: 'geography-1',
    category: 'Geography',
    title: 'Top 10 largest countries by land area',
    difficulty: 'easy',
    answers: [
      { text: 'Russia', rank: 1, points: 1 },
      { text: 'Canada', rank: 2, points: 2 },
      { text: 'China', rank: 3, points: 3 },
      { text: 'United States', rank: 4, points: 4 },
      { text: 'Brazil', rank: 5, points: 5 },
      { text: 'Australia', rank: 6, points: 6 },
      { text: 'India', rank: 7, points: 7 },
      { text: 'Argentina', rank: 8, points: 8 },
      { text: 'Kazakhstan', rank: 9, points: 9 },
      { text: 'Algeria', rank: 10, points: 10 }
    ]
  },
  {
    id: 'geography-2',
    category: 'Geography',
    title: 'Top 10 most populated countries in the world',
    difficulty: 'easy',
    answers: [
      { text: 'China', rank: 1, points: 1 },
      { text: 'India', rank: 2, points: 2 },
      { text: 'United States', rank: 3, points: 3 },
      { text: 'Indonesia', rank: 4, points: 4 },
      { text: 'Pakistan', rank: 5, points: 5 },
      { text: 'Brazil', rank: 6, points: 6 },
      { text: 'Nigeria', rank: 7, points: 7 },
      { text: 'Bangladesh', rank: 8, points: 8 },
      { text: 'Russia', rank: 9, points: 9 },
      { text: 'Mexico', rank: 10, points: 10 }
    ]
  },
  {
    id: 'geography-3',
    category: 'Geography',
    title: 'Top 10 tallest mountains in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Mount Everest', rank: 1, points: 1 },
      { text: 'K2', rank: 2, points: 2 },
      { text: 'Kangchenjunga', rank: 3, points: 3 },
      { text: 'Lhotse', rank: 4, points: 4 },
      { text: 'Makalu', rank: 5, points: 5 },
      { text: 'Cho Oyu', rank: 6, points: 6 },
      { text: 'Dhaulagiri', rank: 7, points: 7 },
      { text: 'Manaslu', rank: 8, points: 8 },
      { text: 'Nanga Parbat', rank: 9, points: 9 },
      { text: 'Annapurna I', rank: 10, points: 10 }
    ]
  },
  {
    id: 'geography-4',
    category: 'Geography',
    title: 'Top 10 largest cities by population',
    difficulty: 'medium',
    answers: [
      { text: 'Tokyo', rank: 1, points: 1 },
      { text: 'Delhi', rank: 2, points: 2 },
      { text: 'Shanghai', rank: 3, points: 3 },
      { text: 'São Paulo', rank: 4, points: 4 },
      { text: 'Mexico City', rank: 5, points: 5 },
      { text: 'Cairo', rank: 6, points: 6 },
      { text: 'Mumbai', rank: 7, points: 7 },
      { text: 'Beijing', rank: 8, points: 8 },
      { text: 'Dhaka', rank: 9, points: 9 },
      { text: 'Osaka', rank: 10, points: 10 }
    ]
  },
  {
    id: 'geography-5',
    category: 'Geography',
    title: 'Top 10 longest rivers in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Nile', rank: 1, points: 1 },
      { text: 'Amazon', rank: 2, points: 2 },
      { text: 'Yangtze', rank: 3, points: 3 },
      { text: 'Mississippi-Missouri', rank: 4, points: 4 },
      { text: 'Yenisei', rank: 5, points: 5 },
      { text: 'Yellow River', rank: 6, points: 6 },
      { text: 'Ob-Irtysh', rank: 7, points: 7 },
      { text: 'Paraná', rank: 8, points: 8 },
      { text: 'Congo', rank: 9, points: 9 },
      { text: 'Amur', rank: 10, points: 10 }
    ]
  },
  {
    id: 'geography-6',
    category: 'Geography',
    title: 'Top 10 most spoken languages in the world (total speakers)',
    difficulty: 'medium',
    answers: [
      { text: 'English', rank: 1, points: 1, normalized: 'english', aliases: ['english language'] },
      { text: 'Mandarin Chinese', rank: 2, points: 2, normalized: 'mandarin chinese', aliases: ['mandarin', 'chinese'] },
      { text: 'Hindi', rank: 3, points: 3, normalized: 'hindi', aliases: ['hindi language'] },
      { text: 'Spanish', rank: 4, points: 4, normalized: 'spanish', aliases: ['espanol', 'spanish language'] },
      { text: 'French', rank: 5, points: 5, normalized: 'french', aliases: ['french language'] },
      { text: 'Modern Standard Arabic', rank: 6, points: 6, normalized: 'modern standard arabic', aliases: ['arabic', 'standard arabic'] },
      { text: 'Bengali', rank: 7, points: 7, normalized: 'bengali', aliases: ['bangla', 'bengali language'] },
      { text: 'Russian', rank: 8, points: 8, normalized: 'russian', aliases: ['russian language'] },
      { text: 'Portuguese', rank: 9, points: 9, normalized: 'portuguese', aliases: ['portuguese language'] },
      { text: 'Urdu', rank: 10, points: 10, normalized: 'urdu', aliases: ['urdu language'] }
    ]
  },
  {
    id: 'geography-7',
    category: 'Geography',
    title: 'Top 10 largest deserts in the world',
    difficulty: 'hard',
    answers: [
      { text: 'Antarctic Desert', rank: 1, points: 1, normalized: 'antarctic desert', aliases: ['antarctic', 'antarctica desert'] },
      { text: 'Arctic Desert', rank: 2, points: 2, normalized: 'arctic desert', aliases: ['arctic', 'arctic polar desert'] },
      { text: 'Sahara Desert', rank: 3, points: 3, normalized: 'sahara desert', aliases: ['sahara'] },
      { text: 'Great Australian Desert', rank: 4, points: 4, normalized: 'great australian desert', aliases: ['australian desert', 'great australian'] },
      { text: 'Arabian Desert', rank: 5, points: 5, normalized: 'arabian desert', aliases: ['arabian'] },
      { text: 'Gobi Desert', rank: 6, points: 6, normalized: 'gobi desert', aliases: ['gobi'] },
      { text: 'Kalahari Desert', rank: 7, points: 7, normalized: 'kalahari desert', aliases: ['kalahari'] },
      { text: 'Patagonian Desert', rank: 8, points: 8, normalized: 'patagonian desert', aliases: ['patagonian', 'patagonia desert'] },
      { text: 'Syrian Desert', rank: 9, points: 9, normalized: 'syrian desert', aliases: ['syrian'] },
      { text: 'Great Basin Desert', rank: 10, points: 10, normalized: 'great basin desert', aliases: ['great basin'] }
    ]
  },
  {
    id: 'geography-8',
    category: 'Geography',
    title: 'Top 10 countries with the longest coastlines',
    difficulty: 'hard',
    answers: [
      { text: 'Canada', rank: 1, points: 1, normalized: 'canada', aliases: [] },
      { text: 'Indonesia', rank: 2, points: 2, normalized: 'indonesia', aliases: [] },
      { text: 'Greenland', rank: 3, points: 3, normalized: 'greenland', aliases: [] },
      { text: 'Russia', rank: 4, points: 4, normalized: 'russia', aliases: [] },
      { text: 'Philippines', rank: 5, points: 5, normalized: 'philippines', aliases: [] },
      { text: 'Japan', rank: 6, points: 6, normalized: 'japan', aliases: [] },
      { text: 'Australia', rank: 7, points: 7, normalized: 'australia', aliases: [] },
      { text: 'United States', rank: 8, points: 8, normalized: 'united states', aliases: ['usa', 'us', 'america'] },
      { text: 'Norway', rank: 9, points: 9, normalized: 'norway', aliases: [] },
      { text: 'New Zealand', rank: 10, points: 10, normalized: 'new zealand', aliases: ['nz'] }
    ]
  },
  {
    id: 'geography-9',
    category: 'Geography',
    title: 'Top 10 deepest lakes in the world',
    difficulty: 'hard',
    answers: [
      { text: 'Baikal', rank: 1, points: 1, normalized: 'baikal', aliases: ['lake baikal'] },
      { text: 'Tanganyika', rank: 2, points: 2, normalized: 'tanganyika', aliases: ['lake tanganyika'] },
      { text: 'Caspian Sea', rank: 3, points: 3, normalized: 'caspian sea', aliases: ['caspian'] },
      { text: 'Vostok', rank: 4, points: 4, normalized: 'vostok', aliases: ['lake vostok'] },
      { text: "O'Higgins/San Martín", rank: 5, points: 5, normalized: 'ohiggins san martin', aliases: ['lake ohiggins', 'san martin lake'] },
      { text: 'Crater Lake', rank: 6, points: 6, normalized: 'crater lake', aliases: [] },
      { text: 'Malawi', rank: 7, points: 7, normalized: 'malawi', aliases: ['lake malawi', 'lake nyasa'] },
      { text: 'Great Slave Lake', rank: 8, points: 8, normalized: 'great slave lake', aliases: [] },
      { text: 'Băřtibai Lake', rank: 9, points: 9, normalized: 'bartibai lake', aliases: ['bartibai'] },
      { text: 'Issyk-Kul', rank: 10, points: 10, normalized: 'issyk-kul', aliases: ['lake issyk-kul', 'issyk kul'] }
    ]
  },
  {
    id: 'geography-10',
    category: 'Geography',
    title: 'Top 10 busiest airports in the world (passenger traffic)',
    difficulty: 'hard',
    answers: [
      { text: 'Hartsfield-Jackson Atlanta Intl', rank: 1, points: 1, normalized: 'hartsfield jackson atlanta', aliases: ['atlanta airport', 'atl'] },
      { text: 'Beijing Capital Intl', rank: 2, points: 2, normalized: 'beijing capital', aliases: ['beijing airport', 'pek'] },
      { text: 'Dallas/Fort Worth Intl', rank: 3, points: 3, normalized: 'dallas fort worth', aliases: ['dfw', 'dallas airport'] },
      { text: 'Denver Intl', rank: 4, points: 4, normalized: 'denver', aliases: ['denver airport', 'dia', 'den'] },
      { text: 'Tokyo Haneda', rank: 5, points: 5, normalized: 'tokyo haneda', aliases: ['haneda', 'hnd'] },
      { text: 'Los Angeles Intl', rank: 6, points: 6, normalized: 'los angeles', aliases: ['lax', 'la airport'] },
      { text: 'Dubai Intl', rank: 7, points: 7, normalized: 'dubai', aliases: ['dubai airport', 'dxb'] },
      { text: "O'Hare Intl", rank: 8, points: 8, normalized: 'ohare', aliases: ['ohare', 'chicago ohare', 'ord'] },
      { text: 'London Heathrow', rank: 9, points: 9, normalized: 'london heathrow', aliases: ['heathrow', 'lhr'] },
      { text: 'Shanghai Pudong Intl', rank: 10, points: 10, normalized: 'shanghai pudong', aliases: ['pudong', 'pvg'] }
    ]
  },
  {
    id: 'geography-11',
    category: 'Geography',
    title: 'Top 10 tallest buildings in the world (by height)',
    difficulty: 'hard',
    answers: [
      { text: 'Burj Khalifa', rank: 1, points: 1, normalized: 'burj khalifa', aliases: ['burj'] },
      { text: 'Merdeka 118', rank: 2, points: 2, normalized: 'merdeka 118', aliases: ['merdeka'] },
      { text: 'Shanghai Tower', rank: 3, points: 3, normalized: 'shanghai tower', aliases: [] },
      { text: 'Makkah Royal Clock Tower', rank: 4, points: 4, normalized: 'makkah royal clock tower', aliases: ['abraj al-bait', 'makkah clock tower'] },
      { text: 'Ping An International Finance Centre', rank: 5, points: 5, normalized: 'ping an international finance centre', aliases: ['ping an finance centre', 'ping an tower'] },
      { text: 'Lotte World Tower', rank: 6, points: 6, normalized: 'lotte world tower', aliases: ['lotte tower'] },
      { text: 'One World Trade Center', rank: 7, points: 7, normalized: 'one world trade center', aliases: ['1 wtc', 'freedom tower'] },
      { text: 'Guangzhou CTF Finance Centre', rank: 8, points: 8, normalized: 'guangzhou ctf finance centre', aliases: ['guangzhou ctf'] },
      { text: 'Tianjin CTF Finance Centre', rank: 9, points: 9, normalized: 'tianjin ctf finance centre', aliases: ['tianjin ctf'] },
      { text: 'CITIC Tower', rank: 10, points: 10, normalized: 'citic tower', aliases: ['china zun', 'zhongguo zun'] }
    ]
  },
  {
    id: 'geography-12',
    category: 'Geography',
    title: 'Top 10 largest oceans/sea areas (by surface)',
    difficulty: 'medium',
    answers: [
      { text: 'Pacific Ocean', rank: 1, points: 1, normalized: 'pacific ocean', aliases: ['pacific'] },
      { text: 'Atlantic Ocean', rank: 2, points: 2, normalized: 'atlantic ocean', aliases: ['atlantic'] },
      { text: 'Indian Ocean', rank: 3, points: 3, normalized: 'indian ocean', aliases: [] },
      { text: 'Southern Ocean', rank: 4, points: 4, normalized: 'southern ocean', aliases: ['antarctic ocean'] },
      { text: 'Arctic Ocean', rank: 5, points: 5, normalized: 'arctic ocean', aliases: ['arctic'] },
      { text: 'Coral Sea', rank: 6, points: 6, normalized: 'coral sea', aliases: [] },
      { text: 'Arabian Sea', rank: 7, points: 7, normalized: 'arabian sea', aliases: [] },
      { text: 'South China Sea', rank: 8, points: 8, normalized: 'south china sea', aliases: [] },
      { text: 'Sea of Okhotsk', rank: 9, points: 9, normalized: 'sea of okhotsk', aliases: ['okhotsk sea'] },
      { text: 'Gulf of Mexico', rank: 10, points: 10, normalized: 'gulf of mexico', aliases: [] }
    ]
  },
  {
    id: 'geography-13',
    category: 'Geography',
    title: 'Top 10 countries by number of UNESCO World Heritage Sites',
    difficulty: 'hard',
    answers: [
      { text: 'Italy', rank: 1, points: 1, normalized: 'italy', aliases: [] },
      { text: 'China', rank: 2, points: 2, normalized: 'china', aliases: [] },
      { text: 'Spain', rank: 3, points: 3, normalized: 'spain', aliases: [] },
      { text: 'France', rank: 4, points: 4, normalized: 'france', aliases: [] },
      { text: 'Germany', rank: 5, points: 5, normalized: 'germany', aliases: [] },
      { text: 'India', rank: 6, points: 6, normalized: 'india', aliases: [] },
      { text: 'Mexico', rank: 7, points: 7, normalized: 'mexico', aliases: [] },
      { text: 'United Kingdom', rank: 8, points: 8, normalized: 'united kingdom', aliases: ['uk', 'britain', 'great britain'] },
      { text: 'Russia', rank: 9, points: 9, normalized: 'russia', aliases: [] },
      { text: 'United States', rank: 10, points: 10, normalized: 'united states', aliases: ['usa', 'us', 'america'] }
    ]
  },
  {
    id: 'geography-14',
    category: 'Geography',
    title: 'Top 10 Olympic Games facts',
    difficulty: 'medium',
    answers: [
      { text: 'First ancient Olympics: 776 BC', rank: 1, points: 1, normalized: 'first ancient olympics 776 bc', aliases: ['776 bc', 'ancient olympics'] },
      { text: 'Modern Olympics revived: 1896', rank: 2, points: 2, normalized: 'modern olympics revived 1896', aliases: ['1896', 'modern olympics'] },
      { text: 'Ancient Olympics banned: 393 AD', rank: 3, points: 3, normalized: 'ancient olympics banned 393 ad', aliases: ['393 ad', 'olympics banned'] },
      { text: 'Olympics are every four years', rank: 4, points: 4, normalized: 'olympics are every four years', aliases: ['every 4 years', 'quadrennial'] },
      { text: 'Summer and Winter Games separated', rank: 5, points: 5, normalized: 'summer and winter games separated', aliases: ['summer winter separated'] },
      { text: 'Olympic rings represent continents', rank: 6, points: 6, normalized: 'olympic rings represent continents', aliases: ['rings continents', 'five rings'] },
      { text: 'Athletes compete for gold/silver/bronze', rank: 7, points: 7, normalized: 'athletes compete for gold silver bronze', aliases: ['gold silver bronze', 'medals'] },
      { text: 'Marathon first run: 1896', rank: 8, points: 8, normalized: 'marathon first run 1896', aliases: ['first marathon', 'marathon 1896'] },
      { text: 'Most medals: United States', rank: 9, points: 9, normalized: 'most medals united states', aliases: ['usa most medals', 'us most medals'] },
      { text: 'Youth Olympics exist', rank: 10, points: 10, normalized: 'youth olympics exist', aliases: ['youth olympic games', 'yog'] }
    ]
  },
  {
    id: 'geography-15',
    category: 'Geography',
    title: 'Top 10 Earth geological facts',
    difficulty: 'hard',
    answers: [
      { text: "Earth isn't perfectly round", rank: 1, points: 1, normalized: 'earth isnt perfectly round', aliases: ['earth oblate', 'not perfectly round'] },
      { text: 'Largest living structure is coral reefs', rank: 2, points: 2, normalized: 'largest living structure is coral reefs', aliases: ['coral reefs', 'great barrier reef'] },
      { text: 'Antarctica has largest ice sheet', rank: 3, points: 3, normalized: 'antarctica has largest ice sheet', aliases: ['antarctic ice sheet', 'largest ice sheet'] },
      { text: 'Moon is moving away from Earth', rank: 4, points: 4, normalized: 'moon is moving away from earth', aliases: ['moon moving away', 'lunar recession'] },
      { text: 'Atacama is driest place on Earth', rank: 5, points: 5, normalized: 'atacama is driest place on earth', aliases: ['atacama desert', 'driest place'] },
      { text: 'Earth has squishy interior', rank: 6, points: 6, normalized: 'earth has squishy interior', aliases: ['mantle', 'earth interior'] },
      { text: 'Magnetic poles shift over time', rank: 7, points: 7, normalized: 'magnetic poles shift over time', aliases: ['magnetic pole reversal', 'pole shift'] },
      { text: 'Europe 2nd smallest continent by area', rank: 8, points: 8, normalized: 'europe 2nd smallest continent by area', aliases: ['europe smallest', 'europe second smallest'] },
      { text: 'Tibetan Plateau is "third pole"', rank: 9, points: 9, normalized: 'tibetan plateau is third pole', aliases: ['tibetan plateau', 'third pole'] },
      { text: 'Trees breathe (exchange gases)', rank: 10, points: 10, normalized: 'trees breathe', aliases: ['trees exchange gases', 'trees respiration'] }
    ]
  },
  {
    id: 'geography-16',
    category: 'Geography',
    title: 'Top 10 world natural wonders by common listings',
    difficulty: 'medium',
    answers: [
      { text: 'Great Barrier Reef', rank: 1, points: 1, normalized: 'great barrier reef', aliases: ['barrier reef'] },
      { text: 'Grand Canyon', rank: 2, points: 2, normalized: 'grand canyon', aliases: [] },
      { text: 'Mount Everest', rank: 3, points: 3, normalized: 'mount everest', aliases: ['everest'] },
      { text: 'Aurora Borealis', rank: 4, points: 4, normalized: 'aurora borealis', aliases: ['northern lights', 'aurora'] },
      { text: 'Harbor of Rio de Janeiro', rank: 5, points: 5, normalized: 'harbor of rio de janeiro', aliases: ['rio harbor', 'guanabara bay'] },
      { text: 'Parícutin Volcano', rank: 6, points: 6, normalized: 'paricutin volcano', aliases: ['paricutin'] },
      { text: 'Victoria Falls', rank: 7, points: 7, normalized: 'victoria falls', aliases: ['mosi-oa-tunya'] },
      { text: 'Galápagos Islands', rank: 8, points: 8, normalized: 'galapagos islands', aliases: ['galapagos'] },
      { text: 'Antelope Canyon', rank: 9, points: 9, normalized: 'antelope canyon', aliases: [] },
      { text: 'Mount Kilimanjaro', rank: 10, points: 10, normalized: 'mount kilimanjaro', aliases: ['kilimanjaro'] }
    ]
  },

  // Movies & TV Category
  {
    id: 'movies-6',
    category: 'Movies & TV',
    title: 'Top 10 most popular TV shows of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Friends', rank: 1, points: 1, normalized: 'friends' },
      { text: 'Game of Thrones', rank: 2, points: 2, aliases: ['got', 'game of thrones'] },
      { text: 'Breaking Bad', rank: 3, points: 3, aliases: ['breaking bad'] },
      { text: 'The Office', rank: 4, points: 4, aliases: ['office'] },
      { text: 'Stranger Things', rank: 5, points: 5, aliases: ['stranger things'] },
      { text: 'The Walking Dead', rank: 6, points: 6, aliases: ['walking dead'] },
      { text: 'Modern Family', rank: 7, points: 7, aliases: ['modern family'] },
      { text: 'The Big Bang Theory', rank: 8, points: 8, aliases: ['big bang theory', 'tbbt'] },
      { text: 'Grey\'s Anatomy', rank: 9, points: 9, aliases: ['greys anatomy', 'greys'] },
      { text: 'The Simpsons', rank: 10, points: 10, aliases: ['simpsons'] }
    ]
  },
  {
    id: 'movies-7',
    category: 'Movies & TV',
    title: 'Top 10 best-selling video games of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Minecraft', rank: 1, points: 1, normalized: 'minecraft' },
      { text: 'Grand Theft Auto V', rank: 2, points: 2, aliases: ['gta 5', 'gta v', 'grand theft auto 5'] },
      { text: 'Tetris', rank: 3, points: 3, normalized: 'tetris' },
      { text: 'Wii Sports', rank: 4, points: 4, aliases: ['wii sports'] },
      { text: 'PUBG: Battlegrounds', rank: 5, points: 5, aliases: ['pubg', 'playerunknowns battlegrounds'] },
      { text: 'Super Mario Bros.', rank: 6, points: 6, aliases: ['mario bros', 'super mario'] },
      { text: 'Pokemon Red/Green/Blue', rank: 7, points: 7, aliases: ['pokemon red', 'pokemon blue', 'pokemon green'] },
      { text: 'Red Dead Redemption 2', rank: 8, points: 8, aliases: ['red dead 2', 'rdr2'] },
      { text: 'The Witcher 3', rank: 9, points: 9, aliases: ['witcher 3', 'wild hunt'] },
      { text: 'Call of Duty: Modern Warfare', rank: 10, points: 10, aliases: ['modern warfare', 'cod mw'] }
    ]
  },

  // Food & Drink Category
  {
    id: 'food-1',
    category: 'Food & Drink',
    title: 'Top 10 most popular fast food chains in the world',
    difficulty: 'easy',
    answers: [
      { text: 'McDonald\'s', rank: 1, points: 1, aliases: ['mcdonalds', 'mcd'] },
      { text: 'KFC', rank: 2, points: 2, normalized: 'kfc' },
      { text: 'Subway', rank: 3, points: 3, normalized: 'subway' },
      { text: 'Burger King', rank: 4, points: 4, aliases: ['bk'] },
      { text: 'Pizza Hut', rank: 5, points: 5, aliases: ['pizzahut'] },
      { text: 'Domino\'s', rank: 6, points: 6, aliases: ['dominos'] },
      { text: 'Starbucks', rank: 7, points: 7, normalized: 'starbucks' },
      { text: 'Taco Bell', rank: 8, points: 8, aliases: ['tacobell'] },
      { text: 'Wendy\'s', rank: 9, points: 9, aliases: ['wendys'] },
      { text: 'Dunkin\'', rank: 10, points: 10, aliases: ['dunkin donuts', 'dunkin'] }
    ]
  },
  {
    id: 'food-2',
    category: 'Food & Drink',
    title: 'Top 10 most popular pizza toppings',
    difficulty: 'easy',
    answers: [
      { text: 'Pepperoni', rank: 1, points: 1, normalized: 'pepperoni' },
      { text: 'Mushrooms', rank: 2, points: 2, normalized: 'mushrooms' },
      { text: 'Extra Cheese', rank: 3, points: 3, aliases: ['cheese', 'extra cheese'] },
      { text: 'Sausage', rank: 4, points: 4, normalized: 'sausage' },
      { text: 'Onions', rank: 5, points: 5, normalized: 'onions' },
      { text: 'Black Olives', rank: 6, points: 6, aliases: ['olives', 'black olives'] },
      { text: 'Green Peppers', rank: 7, points: 7, aliases: ['peppers', 'green peppers'] },
      { text: 'Bacon', rank: 8, points: 8, normalized: 'bacon' },
      { text: 'Ham', rank: 9, points: 9, normalized: 'ham' },
      { text: 'Pineapple', rank: 10, points: 10, normalized: 'pineapple' }
    ]
  },
  {
    id: 'food-3',
    category: 'Food & Drink',
    title: 'Top 10 most consumed beverages in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Water', rank: 1, points: 1, normalized: 'water' },
      { text: 'Tea', rank: 2, points: 2, normalized: 'tea' },
      { text: 'Coffee', rank: 3, points: 3, normalized: 'coffee' },
      { text: 'Beer', rank: 4, points: 4, normalized: 'beer' },
      { text: 'Milk', rank: 5, points: 5, normalized: 'milk' },
      { text: 'Orange Juice', rank: 6, points: 6, aliases: ['oj', 'orange juice'] },
      { text: 'Wine', rank: 7, points: 7, normalized: 'wine' },
      { text: 'Soda/Pop', rank: 8, points: 8, aliases: ['soda', 'pop', 'soft drinks'] },
      { text: 'Lemonade', rank: 9, points: 9, normalized: 'lemonade' },
      { text: 'Hot Chocolate', rank: 10, points: 10, aliases: ['hot chocolate', 'cocoa'] }
    ]
  },
  {
    id: 'food-4',
    category: 'Food & Drink',
    title: 'Top 10 most popular fruits in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Banana', rank: 1, points: 1, normalized: 'banana', aliases: [] },
      { text: 'Apple', rank: 2, points: 2, normalized: 'apple', aliases: [] },
      { text: 'Orange', rank: 3, points: 3, normalized: 'orange', aliases: [] },
      { text: 'Grape', rank: 4, points: 4, normalized: 'grape', aliases: ['grapes'] },
      { text: 'Mango', rank: 5, points: 5, normalized: 'mango', aliases: [] },
      { text: 'Pineapple', rank: 6, points: 6, normalized: 'pineapple', aliases: [] },
      { text: 'Strawberry', rank: 7, points: 7, normalized: 'strawberry', aliases: ['strawberries'] },
      { text: 'Watermelon', rank: 8, points: 8, normalized: 'watermelon', aliases: [] },
      { text: 'Pear', rank: 9, points: 9, normalized: 'pear', aliases: [] },
      { text: 'Peach', rank: 10, points: 10, normalized: 'peach', aliases: [] }
    ]
  },
  {
    id: 'food-5',
    category: 'Food & Drink',
    title: 'Top 10 most consumed vegetables in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Potato', rank: 1, points: 1, normalized: 'potato', aliases: ['potatoes'] },
      { text: 'Tomato', rank: 2, points: 2, normalized: 'tomato', aliases: ['tomatoes'] },
      { text: 'Onion', rank: 3, points: 3, normalized: 'onion', aliases: ['onions'] },
      { text: 'Cabbage', rank: 4, points: 4, normalized: 'cabbage', aliases: [] },
      { text: 'Cucumber', rank: 5, points: 5, normalized: 'cucumber', aliases: ['cucumbers'] },
      { text: 'Eggplant', rank: 6, points: 6, normalized: 'eggplant', aliases: ['aubergine'] },
      { text: 'Carrot', rank: 7, points: 7, normalized: 'carrot', aliases: ['carrots'] },
      { text: 'Lettuce', rank: 8, points: 8, normalized: 'lettuce', aliases: [] },
      { text: 'Bell Pepper', rank: 9, points: 9, normalized: 'bell pepper', aliases: ['capsicum', 'bell peppers'] },
      { text: 'Spinach', rank: 10, points: 10, normalized: 'spinach', aliases: [] }
    ]
  },
  {
    id: 'food-6',
    category: 'Food & Drink',
    title: 'Top 10 most eaten meats in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Pork', rank: 1, points: 1, normalized: 'pork', aliases: [] },
      { text: 'Chicken', rank: 2, points: 2, normalized: 'chicken', aliases: ['poultry'] },
      { text: 'Beef', rank: 3, points: 3, normalized: 'beef', aliases: [] },
      { text: 'Fish', rank: 4, points: 4, normalized: 'fish', aliases: ['seafood'] },
      { text: 'Goat', rank: 5, points: 5, normalized: 'goat', aliases: [] },
      { text: 'Sheep (Lamb)', rank: 6, points: 6, normalized: 'sheep', aliases: ['lamb', 'mutton'] },
      { text: 'Turkey', rank: 7, points: 7, normalized: 'turkey', aliases: [] },
      { text: 'Duck', rank: 8, points: 8, normalized: 'duck', aliases: [] },
      { text: 'Buffalo', rank: 9, points: 9, normalized: 'buffalo', aliases: ['water buffalo'] },
      { text: 'Rabbit', rank: 10, points: 10, normalized: 'rabbit', aliases: [] }
    ]
  },
  {
    id: 'food-7',
    category: 'Food & Drink',
    title: 'Top 10 most produced foods in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Sugarcane', rank: 1, points: 1, normalized: 'sugarcane', aliases: ['sugar cane'] },
      { text: 'Maize (Corn)', rank: 2, points: 2, normalized: 'maize', aliases: ['corn'] },
      { text: 'Rice', rank: 3, points: 3, normalized: 'rice', aliases: [] },
      { text: 'Wheat', rank: 4, points: 4, normalized: 'wheat', aliases: [] },
      { text: 'Potatoes', rank: 5, points: 5, normalized: 'potatoes', aliases: ['potato'] },
      { text: 'Soybeans', rank: 6, points: 6, normalized: 'soybeans', aliases: ['soybean', 'soya'] },
      { text: 'Cassava', rank: 7, points: 7, normalized: 'cassava', aliases: ['yuca', 'manioc'] },
      { text: 'Sugar Beet', rank: 8, points: 8, normalized: 'sugar beet', aliases: ['sugarbeet'] },
      { text: 'Tomatoes', rank: 9, points: 9, normalized: 'tomatoes', aliases: ['tomato'] },
      { text: 'Bananas', rank: 10, points: 10, normalized: 'bananas', aliases: ['banana'] }
    ]
  },
  {
    id: 'food-8',
    category: 'Food & Drink',
    title: 'Top 10 most consumed grains in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Rice', rank: 1, points: 1, normalized: 'rice', aliases: [] },
      { text: 'Wheat', rank: 2, points: 2, normalized: 'wheat', aliases: [] },
      { text: 'Maize (Corn)', rank: 3, points: 3, normalized: 'maize', aliases: ['corn'] },
      { text: 'Barley', rank: 4, points: 4, normalized: 'barley', aliases: [] },
      { text: 'Oats', rank: 5, points: 5, normalized: 'oats', aliases: ['oat'] },
      { text: 'Sorghum', rank: 6, points: 6, normalized: 'sorghum', aliases: [] },
      { text: 'Millet', rank: 7, points: 7, normalized: 'millet', aliases: [] },
      { text: 'Rye', rank: 8, points: 8, normalized: 'rye', aliases: [] },
      { text: 'Quinoa', rank: 9, points: 9, normalized: 'quinoa', aliases: [] },
      { text: 'Buckwheat', rank: 10, points: 10, normalized: 'buckwheat', aliases: [] }
    ]
  },
  {
    id: 'food-9',
    category: 'Food & Drink',
    title: 'Top 10 most popular cuisines in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Italian', rank: 1, points: 1, normalized: 'italian', aliases: ['italian cuisine'] },
      { text: 'Chinese', rank: 2, points: 2, normalized: 'chinese', aliases: ['chinese cuisine'] },
      { text: 'Mexican', rank: 3, points: 3, normalized: 'mexican', aliases: ['mexican cuisine'] },
      { text: 'Indian', rank: 4, points: 4, normalized: 'indian', aliases: ['indian cuisine'] },
      { text: 'Japanese', rank: 5, points: 5, normalized: 'japanese', aliases: ['japanese cuisine'] },
      { text: 'Thai', rank: 6, points: 6, normalized: 'thai', aliases: ['thai cuisine'] },
      { text: 'French', rank: 7, points: 7, normalized: 'french', aliases: ['french cuisine'] },
      { text: 'American', rank: 8, points: 8, normalized: 'american', aliases: ['american cuisine'] },
      { text: 'Spanish', rank: 9, points: 9, normalized: 'spanish', aliases: ['spanish cuisine'] },
      { text: 'Turkish', rank: 10, points: 10, normalized: 'turkish', aliases: ['turkish cuisine'] }
    ]
  },
  {
    id: 'food-10',
    category: 'Food & Drink',
    title: 'Top 10 most popular cheeses in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Cheddar', rank: 1, points: 1, normalized: 'cheddar', aliases: [] },
      { text: 'Mozzarella', rank: 2, points: 2, normalized: 'mozzarella', aliases: [] },
      { text: 'Parmesan', rank: 3, points: 3, normalized: 'parmesan', aliases: ['parmigiano'] },
      { text: 'Gouda', rank: 4, points: 4, normalized: 'gouda', aliases: [] },
      { text: 'Brie', rank: 5, points: 5, normalized: 'brie', aliases: [] },
      { text: 'Feta', rank: 6, points: 6, normalized: 'feta', aliases: [] },
      { text: 'Swiss', rank: 7, points: 7, normalized: 'swiss', aliases: ['swiss cheese', 'emmental'] },
      { text: 'Camembert', rank: 8, points: 8, normalized: 'camembert', aliases: [] },
      { text: 'Monterey Jack', rank: 9, points: 9, normalized: 'monterey jack', aliases: ['jack cheese'] },
      { text: 'Blue Cheese', rank: 10, points: 10, normalized: 'blue cheese', aliases: ['bleu cheese', 'gorgonzola', 'roquefort'] }
    ]
  },
  {
    id: 'food-11',
    category: 'Food & Drink',
    title: 'Top 10 most consumed dairy products in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Milk', rank: 1, points: 1, normalized: 'milk', aliases: [] },
      { text: 'Cheese', rank: 2, points: 2, normalized: 'cheese', aliases: [] },
      { text: 'Yogurt', rank: 3, points: 3, normalized: 'yogurt', aliases: ['yoghurt'] },
      { text: 'Butter', rank: 4, points: 4, normalized: 'butter', aliases: [] },
      { text: 'Cream', rank: 5, points: 5, normalized: 'cream', aliases: [] },
      { text: 'Ice Cream', rank: 6, points: 6, normalized: 'ice cream', aliases: [] },
      { text: 'Ghee', rank: 7, points: 7, normalized: 'ghee', aliases: ['clarified butter'] },
      { text: 'Condensed Milk', rank: 8, points: 8, normalized: 'condensed milk', aliases: [] },
      { text: 'Evaporated Milk', rank: 9, points: 9, normalized: 'evaporated milk', aliases: [] },
      { text: 'Sour Cream', rank: 10, points: 10, normalized: 'sour cream', aliases: [] }
    ]
  },
  {
    id: 'food-12',
    category: 'Food & Drink',
    title: 'Top 10 most popular fast food items in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Burger', rank: 1, points: 1, normalized: 'burger', aliases: ['hamburger'] },
      { text: 'Pizza', rank: 2, points: 2, normalized: 'pizza', aliases: [] },
      { text: 'Fried Chicken', rank: 3, points: 3, normalized: 'fried chicken', aliases: [] },
      { text: 'French Fries', rank: 4, points: 4, normalized: 'french fries', aliases: ['fries', 'chips'] },
      { text: 'Hot Dog', rank: 5, points: 5, normalized: 'hot dog', aliases: ['hotdog'] },
      { text: 'Tacos', rank: 6, points: 6, normalized: 'tacos', aliases: ['taco'] },
      { text: 'Sandwich', rank: 7, points: 7, normalized: 'sandwich', aliases: ['sandwiches'] },
      { text: 'Fried Rice', rank: 8, points: 8, normalized: 'fried rice', aliases: [] },
      { text: 'Noodles', rank: 9, points: 9, normalized: 'noodles', aliases: [] },
      { text: 'Shawarma', rank: 10, points: 10, normalized: 'shawarma', aliases: ['shwarma'] }
    ]
  },
  {
    id: 'food-13',
    category: 'Food & Drink',
    title: 'Top 10 most popular desserts in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Ice Cream', rank: 1, points: 1, normalized: 'ice cream', aliases: [] },
      { text: 'Chocolate Cake', rank: 2, points: 2, normalized: 'chocolate cake', aliases: [] },
      { text: 'Brownies', rank: 3, points: 3, normalized: 'brownies', aliases: ['brownie'] },
      { text: 'Cheesecake', rank: 4, points: 4, normalized: 'cheesecake', aliases: [] },
      { text: 'Apple Pie', rank: 5, points: 5, normalized: 'apple pie', aliases: [] },
      { text: 'Donuts', rank: 6, points: 6, normalized: 'donuts', aliases: ['doughnuts', 'donut'] },
      { text: 'Cupcakes', rank: 7, points: 7, normalized: 'cupcakes', aliases: ['cupcake'] },
      { text: 'Pancakes', rank: 8, points: 8, normalized: 'pancakes', aliases: ['pancake'] },
      { text: 'Waffles', rank: 9, points: 9, normalized: 'waffles', aliases: ['waffle'] },
      { text: 'Pudding', rank: 10, points: 10, normalized: 'pudding', aliases: [] }
    ]
  },
  {
    id: 'food-14',
    category: 'Food & Drink',
    title: 'Top 10 most popular street foods in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Hot Dog', rank: 1, points: 1, normalized: 'hot dog', aliases: ['hotdog'] },
      { text: 'Tacos', rank: 2, points: 2, normalized: 'tacos', aliases: ['taco'] },
      { text: 'Falafel', rank: 3, points: 3, normalized: 'falafel', aliases: [] },
      { text: 'Shawarma', rank: 4, points: 4, normalized: 'shawarma', aliases: ['shwarma'] },
      { text: 'Samosa', rank: 5, points: 5, normalized: 'samosa', aliases: ['samosas'] },
      { text: 'Crepes', rank: 6, points: 6, normalized: 'crepes', aliases: ['crepe'] },
      { text: 'Kebab', rank: 7, points: 7, normalized: 'kebab', aliases: ['kebabs', 'kabob'] },
      { text: 'Spring Rolls', rank: 8, points: 8, normalized: 'spring rolls', aliases: ['spring roll'] },
      { text: 'Corn on the Cob', rank: 9, points: 9, normalized: 'corn on the cob', aliases: ['elote', 'roasted corn'] },
      { text: 'Churros', rank: 10, points: 10, normalized: 'churros', aliases: ['churro'] }
    ]
  },
  {
    id: 'food-15',
    category: 'Food & Drink',
    title: 'Top 10 most consumed nuts in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Peanuts', rank: 1, points: 1, normalized: 'peanuts', aliases: ['peanut', 'groundnuts'] },
      { text: 'Almonds', rank: 2, points: 2, normalized: 'almonds', aliases: ['almond'] },
      { text: 'Cashews', rank: 3, points: 3, normalized: 'cashews', aliases: ['cashew'] },
      { text: 'Walnuts', rank: 4, points: 4, normalized: 'walnuts', aliases: ['walnut'] },
      { text: 'Hazelnuts', rank: 5, points: 5, normalized: 'hazelnuts', aliases: ['hazelnut', 'filberts'] },
      { text: 'Pistachios', rank: 6, points: 6, normalized: 'pistachios', aliases: ['pistachio'] },
      { text: 'Pecans', rank: 7, points: 7, normalized: 'pecans', aliases: ['pecan'] },
      { text: 'Brazil Nuts', rank: 8, points: 8, normalized: 'brazil nuts', aliases: ['brazil nut'] },
      { text: 'Macadamia Nuts', rank: 9, points: 9, normalized: 'macadamia nuts', aliases: ['macadamia'] },
      { text: 'Pine Nuts', rank: 10, points: 10, normalized: 'pine nuts', aliases: ['pine nut', 'pignoli'] }
    ]
  },
  {
    id: 'food-16',
    category: 'Food & Drink',
    title: 'Top 10 most popular spices in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Black Pepper', rank: 1, points: 1, normalized: 'black pepper', aliases: ['pepper'] },
      { text: 'Garlic', rank: 2, points: 2, normalized: 'garlic', aliases: [] },
      { text: 'Chili Pepper', rank: 3, points: 3, normalized: 'chili pepper', aliases: ['chili', 'chilli'] },
      { text: 'Cinnamon', rank: 4, points: 4, normalized: 'cinnamon', aliases: [] },
      { text: 'Turmeric', rank: 5, points: 5, normalized: 'turmeric', aliases: [] },
      { text: 'Ginger', rank: 6, points: 6, normalized: 'ginger', aliases: [] },
      { text: 'Cumin', rank: 7, points: 7, normalized: 'cumin', aliases: [] },
      { text: 'Paprika', rank: 8, points: 8, normalized: 'paprika', aliases: [] },
      { text: 'Cloves', rank: 9, points: 9, normalized: 'cloves', aliases: ['clove'] },
      { text: 'Cardamom', rank: 10, points: 10, normalized: 'cardamom', aliases: ['cardamon'] }
    ]
  },
  {
    id: 'food-17',
    category: 'Food & Drink',
    title: 'Top 10 most popular breakfast foods in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Eggs', rank: 1, points: 1, normalized: 'eggs', aliases: ['egg'] },
      { text: 'Bread', rank: 2, points: 2, normalized: 'bread', aliases: [] },
      { text: 'Cereal', rank: 3, points: 3, normalized: 'cereal', aliases: ['cereals'] },
      { text: 'Pancakes', rank: 4, points: 4, normalized: 'pancakes', aliases: ['pancake'] },
      { text: 'Toast', rank: 5, points: 5, normalized: 'toast', aliases: [] },
      { text: 'Oatmeal', rank: 6, points: 6, normalized: 'oatmeal', aliases: ['porridge', 'oats'] },
      { text: 'Croissants', rank: 7, points: 7, normalized: 'croissants', aliases: ['croissant'] },
      { text: 'Yogurt', rank: 8, points: 8, normalized: 'yogurt', aliases: ['yoghurt'] },
      { text: 'Sausages', rank: 9, points: 9, normalized: 'sausages', aliases: ['sausage'] },
      { text: 'Fruit', rank: 10, points: 10, normalized: 'fruit', aliases: ['fruits'] }
    ]
  },
  {
    id: 'food-18',
    category: 'Food & Drink',
    title: 'Top 10 most popular sandwiches in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Hamburger', rank: 1, points: 1, normalized: 'hamburger', aliases: ['burger'] },
      { text: 'Club Sandwich', rank: 2, points: 2, normalized: 'club sandwich', aliases: ['club'] },
      { text: 'BLT', rank: 3, points: 3, normalized: 'blt', aliases: ['bacon lettuce tomato'] },
      { text: 'Grilled Cheese', rank: 4, points: 4, normalized: 'grilled cheese', aliases: [] },
      { text: 'Tuna Sandwich', rank: 5, points: 5, normalized: 'tuna sandwich', aliases: ['tuna'] },
      { text: 'Chicken Sandwich', rank: 6, points: 6, normalized: 'chicken sandwich', aliases: [] },
      { text: 'Philly Cheesesteak', rank: 7, points: 7, normalized: 'philly cheesesteak', aliases: ['cheesesteak'] },
      { text: 'Shawarma Wrap', rank: 8, points: 8, normalized: 'shawarma wrap', aliases: ['shawarma'] },
      { text: 'Falafel Sandwich', rank: 9, points: 9, normalized: 'falafel sandwich', aliases: ['falafel wrap'] },
      { text: 'Submarine Sandwich', rank: 10, points: 10, normalized: 'submarine sandwich', aliases: ['sub', 'hoagie', 'hero'] }
    ]
  },
  {
    id: 'food-19',
    category: 'Food & Drink',
    title: 'Top 10 most popular soups in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Chicken Soup', rank: 1, points: 1, normalized: 'chicken soup', aliases: ['chicken noodle soup'] },
      { text: 'Tomato Soup', rank: 2, points: 2, normalized: 'tomato soup', aliases: [] },
      { text: 'Miso Soup', rank: 3, points: 3, normalized: 'miso soup', aliases: ['miso'] },
      { text: 'Lentil Soup', rank: 4, points: 4, normalized: 'lentil soup', aliases: [] },
      { text: 'Minestrone', rank: 5, points: 5, normalized: 'minestrone', aliases: [] },
      { text: 'French Onion Soup', rank: 6, points: 6, normalized: 'french onion soup', aliases: ['onion soup'] },
      { text: 'Ramen', rank: 7, points: 7, normalized: 'ramen', aliases: [] },
      { text: 'Pho', rank: 8, points: 8, normalized: 'pho', aliases: [] },
      { text: 'Clam Chowder', rank: 9, points: 9, normalized: 'clam chowder', aliases: ['chowder'] },
      { text: 'Borscht', rank: 10, points: 10, normalized: 'borscht', aliases: ['borsch'] }
    ]
  },
  {
    id: 'food-20',
    category: 'Food & Drink',
    title: 'Top 10 most consumed cooking oils in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Palm Oil', rank: 1, points: 1, normalized: 'palm oil', aliases: [] },
      { text: 'Soybean Oil', rank: 2, points: 2, normalized: 'soybean oil', aliases: ['soy oil'] },
      { text: 'Rapeseed (Canola) Oil', rank: 3, points: 3, normalized: 'rapeseed oil', aliases: ['canola oil', 'canola'] },
      { text: 'Sunflower Oil', rank: 4, points: 4, normalized: 'sunflower oil', aliases: [] },
      { text: 'Olive Oil', rank: 5, points: 5, normalized: 'olive oil', aliases: [] },
      { text: 'Peanut Oil', rank: 6, points: 6, normalized: 'peanut oil', aliases: ['groundnut oil'] },
      { text: 'Corn Oil', rank: 7, points: 7, normalized: 'corn oil', aliases: [] },
      { text: 'Cottonseed Oil', rank: 8, points: 8, normalized: 'cottonseed oil', aliases: [] },
      { text: 'Coconut Oil', rank: 9, points: 9, normalized: 'coconut oil', aliases: [] },
      { text: 'Sesame Oil', rank: 10, points: 10, normalized: 'sesame oil', aliases: [] }
    ]
  },

  // Technology Category
  {
    id: 'tech-1',
    category: 'Technology',
    title: 'Top 10 most valuable technology companies in 2024',
    difficulty: 'medium',
    answers: [
      { text: 'Apple', rank: 1, points: 1, normalized: 'apple' },
      { text: 'Microsoft', rank: 2, points: 2, normalized: 'microsoft' },
      { text: 'Alphabet (Google)', rank: 3, points: 3, aliases: ['google', 'alphabet'] },
      { text: 'Amazon', rank: 4, points: 4, normalized: 'amazon' },
      { text: 'NVIDIA', rank: 5, points: 5, normalized: 'nvidia' },
      { text: 'Meta (Facebook)', rank: 6, points: 6, aliases: ['facebook', 'meta'] },
      { text: 'Tesla', rank: 7, points: 7, normalized: 'tesla' },
      { text: 'Berkshire Hathaway', rank: 8, points: 8, aliases: ['berkshire'] },
      { text: 'UnitedHealth Group', rank: 9, points: 9, aliases: ['unitedhealth'] },
      { text: 'Johnson & Johnson', rank: 10, points: 10, aliases: ['jnj', 'johnson and johnson'] }
    ]
  },
  {
    id: 'tech-2',
    category: 'Technology',
    title: 'Top 10 most popular social media platforms',
    difficulty: 'easy',
    answers: [
      { text: 'Facebook', rank: 1, points: 1, normalized: 'facebook' },
      { text: 'YouTube', rank: 2, points: 2, normalized: 'youtube' },
      { text: 'WhatsApp', rank: 3, points: 3, normalized: 'whatsapp' },
      { text: 'Instagram', rank: 4, points: 4, normalized: 'instagram' },
      { text: 'TikTok', rank: 5, points: 5, normalized: 'tiktok' },
      { text: 'Twitter/X', rank: 6, points: 6, aliases: ['twitter', 'x'] },
      { text: 'LinkedIn', rank: 7, points: 7, normalized: 'linkedin' },
      { text: 'Snapchat', rank: 8, points: 8, normalized: 'snapchat' },
      { text: 'Pinterest', rank: 9, points: 9, normalized: 'pinterest' },
      { text: 'Reddit', rank: 10, points: 10, normalized: 'reddit' }
    ]
  },
  {
    id: 'tech-3',
    category: 'Technology',
    title: 'Top 10 most popular programming languages in 2024',
    difficulty: 'hard',
    answers: [
      { text: 'Python', rank: 1, points: 1, normalized: 'python' },
      { text: 'JavaScript', rank: 2, points: 2, aliases: ['js', 'javascript'] },
      { text: 'Java', rank: 3, points: 3, normalized: 'java' },
      { text: 'C++', rank: 4, points: 4, aliases: ['cpp', 'c plus plus'] },
      { text: 'C#', rank: 5, points: 5, aliases: ['csharp', 'c sharp'] },
      { text: 'PHP', rank: 6, points: 6, normalized: 'php' },
      { text: 'TypeScript', rank: 7, points: 7, aliases: ['ts', 'typescript'] },
      { text: 'Go', rank: 8, points: 8, normalized: 'go' },
      { text: 'Rust', rank: 9, points: 9, normalized: 'rust' },
      { text: 'Swift', rank: 10, points: 10, normalized: 'swift' }
    ]
  },
  {
    id: 'tech-4',
    category: 'Technology',
    title: 'Top 10 most used operating systems in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Windows', rank: 1, points: 1, normalized: 'windows', aliases: ['microsoft windows'] },
      { text: 'Android', rank: 2, points: 2, normalized: 'android', aliases: ['google android'] },
      { text: 'iOS', rank: 3, points: 3, normalized: 'ios', aliases: ['apple ios', 'iphone os'] },
      { text: 'macOS', rank: 4, points: 4, normalized: 'macos', aliases: ['mac os', 'osx'] },
      { text: 'Linux', rank: 5, points: 5, normalized: 'linux', aliases: ['gnu linux'] },
      { text: 'Chrome OS', rank: 6, points: 6, normalized: 'chrome os', aliases: ['chromeos'] },
      { text: 'HarmonyOS', rank: 7, points: 7, normalized: 'harmonyos', aliases: ['harmony os'] },
      { text: 'KaiOS', rank: 8, points: 8, normalized: 'kaios', aliases: ['kai os'] },
      { text: 'Tizen', rank: 9, points: 9, normalized: 'tizen', aliases: [] },
      { text: 'Fire OS', rank: 10, points: 10, normalized: 'fire os', aliases: ['fireos', 'amazon fire os'] }
    ]
  },
  {
    id: 'tech-5',
    category: 'Technology',
    title: 'Top 10 most visited websites in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Google', rank: 1, points: 1, normalized: 'google', aliases: ['google.com'] },
      { text: 'YouTube', rank: 2, points: 2, normalized: 'youtube', aliases: ['youtube.com'] },
      { text: 'Facebook', rank: 3, points: 3, normalized: 'facebook', aliases: ['facebook.com'] },
      { text: 'Instagram', rank: 4, points: 4, normalized: 'instagram', aliases: ['instagram.com'] },
      { text: 'X (Twitter)', rank: 5, points: 5, normalized: 'x', aliases: ['twitter', 'x.com', 'twitter.com'] },
      { text: 'Wikipedia', rank: 6, points: 6, normalized: 'wikipedia', aliases: ['wikipedia.org'] },
      { text: 'Reddit', rank: 7, points: 7, normalized: 'reddit', aliases: ['reddit.com'] },
      { text: 'Yahoo', rank: 8, points: 8, normalized: 'yahoo', aliases: ['yahoo.com'] },
      { text: 'WhatsApp', rank: 9, points: 9, normalized: 'whatsapp', aliases: ['whatsapp.com'] },
      { text: 'Amazon', rank: 10, points: 10, normalized: 'amazon', aliases: ['amazon.com'] }
    ]
  },
  {
    id: 'tech-6',
    category: 'Technology',
    title: 'Top 10 biggest video game companies by revenue',
    difficulty: 'medium',
    answers: [
      { text: 'Tencent', rank: 1, points: 1, normalized: 'tencent', aliases: [] },
      { text: 'Sony Interactive Entertainment', rank: 2, points: 2, normalized: 'sony interactive entertainment', aliases: ['sony', 'playstation', 'sie'] },
      { text: 'Microsoft Gaming', rank: 3, points: 3, normalized: 'microsoft gaming', aliases: ['microsoft', 'xbox'] },
      { text: 'Nintendo', rank: 4, points: 4, normalized: 'nintendo', aliases: [] },
      { text: 'NetEase', rank: 5, points: 5, normalized: 'netease', aliases: [] },
      { text: 'Electronic Arts', rank: 6, points: 6, normalized: 'electronic arts', aliases: ['ea'] },
      { text: 'Take-Two Interactive', rank: 7, points: 7, normalized: 'take-two interactive', aliases: ['take two', 'rockstar'] },
      { text: 'Activision Blizzard', rank: 8, points: 8, normalized: 'activision blizzard', aliases: ['activision', 'blizzard'] },
      { text: 'Epic Games', rank: 9, points: 9, normalized: 'epic games', aliases: ['epic'] },
      { text: 'Bandai Namco', rank: 10, points: 10, normalized: 'bandai namco', aliases: ['bandai'] }
    ]
  },
  {
    id: 'tech-7',
    category: 'Technology',
    title: 'Top 10 most sold video game consoles of all time',
    difficulty: 'easy',
    answers: [
      { text: 'PlayStation 2', rank: 1, points: 1, normalized: 'playstation 2', aliases: ['ps2'] },
      { text: 'Nintendo DS', rank: 2, points: 2, normalized: 'nintendo ds', aliases: ['ds', 'nds'] },
      { text: 'Nintendo Switch', rank: 3, points: 3, normalized: 'nintendo switch', aliases: ['switch'] },
      { text: 'Game Boy', rank: 4, points: 4, normalized: 'game boy', aliases: ['gameboy'] },
      { text: 'PlayStation 4', rank: 5, points: 5, normalized: 'playstation 4', aliases: ['ps4'] },
      { text: 'PlayStation', rank: 6, points: 6, normalized: 'playstation', aliases: ['ps1', 'psone'] },
      { text: 'Wii', rank: 7, points: 7, normalized: 'wii', aliases: ['nintendo wii'] },
      { text: 'Xbox 360', rank: 8, points: 8, normalized: 'xbox 360', aliases: [] },
      { text: 'PlayStation 3', rank: 9, points: 9, normalized: 'playstation 3', aliases: ['ps3'] },
      { text: 'Game Boy Advance', rank: 10, points: 10, normalized: 'game boy advance', aliases: ['gba'] }
    ]
  },
  {
    id: 'tech-8',
    category: 'Technology',
    title: 'Top 10 most used web browsers in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Google Chrome', rank: 1, points: 1, normalized: 'google chrome', aliases: ['chrome'] },
      { text: 'Safari', rank: 2, points: 2, normalized: 'safari', aliases: ['apple safari'] },
      { text: 'Microsoft Edge', rank: 3, points: 3, normalized: 'microsoft edge', aliases: ['edge'] },
      { text: 'Firefox', rank: 4, points: 4, normalized: 'firefox', aliases: ['mozilla firefox'] },
      { text: 'Samsung Internet', rank: 5, points: 5, normalized: 'samsung internet', aliases: ['samsung browser'] },
      { text: 'Opera', rank: 6, points: 6, normalized: 'opera', aliases: [] },
      { text: 'UC Browser', rank: 7, points: 7, normalized: 'uc browser', aliases: ['ucbrowser'] },
      { text: 'Brave', rank: 8, points: 8, normalized: 'brave', aliases: ['brave browser'] },
      { text: 'Vivaldi', rank: 9, points: 9, normalized: 'vivaldi', aliases: [] },
      { text: 'Tor Browser', rank: 10, points: 10, normalized: 'tor browser', aliases: ['tor'] }
    ]
  },
  {
    id: 'tech-9',
    category: 'Technology',
    title: 'Top 10 most downloaded mobile apps of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Facebook', rank: 1, points: 1, normalized: 'facebook', aliases: [] },
      { text: 'WhatsApp', rank: 2, points: 2, normalized: 'whatsapp', aliases: [] },
      { text: 'Instagram', rank: 3, points: 3, normalized: 'instagram', aliases: ['ig'] },
      { text: 'Messenger', rank: 4, points: 4, normalized: 'messenger', aliases: ['facebook messenger'] },
      { text: 'TikTok', rank: 5, points: 5, normalized: 'tiktok', aliases: ['tik tok'] },
      { text: 'Snapchat', rank: 6, points: 6, normalized: 'snapchat', aliases: ['snap'] },
      { text: 'Zoom', rank: 7, points: 7, normalized: 'zoom', aliases: ['zoom meetings'] },
      { text: 'Telegram', rank: 8, points: 8, normalized: 'telegram', aliases: [] },
      { text: 'CapCut', rank: 9, points: 9, normalized: 'capcut', aliases: [] },
      { text: 'Spotify', rank: 10, points: 10, normalized: 'spotify', aliases: [] }
    ]
  },
  {
    id: 'tech-10',
    category: 'Technology',
    title: 'Top 10 most popular PC video games of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Minecraft', rank: 1, points: 1, normalized: 'minecraft', aliases: [] },
      { text: 'The Sims', rank: 2, points: 2, normalized: 'the sims', aliases: ['sims'] },
      { text: 'Counter-Strike', rank: 3, points: 3, normalized: 'counter-strike', aliases: ['cs', 'csgo', 'cs2'] },
      { text: 'World of Warcraft', rank: 4, points: 4, normalized: 'world of warcraft', aliases: ['wow'] },
      { text: 'League of Legends', rank: 5, points: 5, normalized: 'league of legends', aliases: ['lol'] },
      { text: 'Grand Theft Auto V', rank: 6, points: 6, normalized: 'grand theft auto v', aliases: ['gta v', 'gta 5'] },
      { text: 'Fortnite', rank: 7, points: 7, normalized: 'fortnite', aliases: [] },
      { text: 'Roblox', rank: 8, points: 8, normalized: 'roblox', aliases: [] },
      { text: 'Dota 2', rank: 9, points: 9, normalized: 'dota 2', aliases: ['dota'] },
      { text: 'Valorant', rank: 10, points: 10, normalized: 'valorant', aliases: [] }
    ]
  },
  {
    id: 'tech-11',
    category: 'Technology',
    title: 'Top 10 biggest semiconductor companies by revenue',
    difficulty: 'hard',
    answers: [
      { text: 'Intel', rank: 1, points: 1, normalized: 'intel', aliases: [] },
      { text: 'Samsung Electronics', rank: 2, points: 2, normalized: 'samsung electronics', aliases: ['samsung'] },
      { text: 'TSMC', rank: 3, points: 3, normalized: 'tsmc', aliases: ['taiwan semiconductor'] },
      { text: 'NVIDIA', rank: 4, points: 4, normalized: 'nvidia', aliases: [] },
      { text: 'Qualcomm', rank: 5, points: 5, normalized: 'qualcomm', aliases: [] },
      { text: 'Broadcom', rank: 6, points: 6, normalized: 'broadcom', aliases: [] },
      { text: 'SK Hynix', rank: 7, points: 7, normalized: 'sk hynix', aliases: ['hynix'] },
      { text: 'Micron Technology', rank: 8, points: 8, normalized: 'micron technology', aliases: ['micron'] },
      { text: 'Texas Instruments', rank: 9, points: 9, normalized: 'texas instruments', aliases: ['ti'] },
      { text: 'AMD', rank: 10, points: 10, normalized: 'amd', aliases: ['advanced micro devices'] }
    ]
  },
  {
    id: 'tech-12',
    category: 'Technology',
    title: 'Top 10 most used email services in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Gmail', rank: 1, points: 1, normalized: 'gmail', aliases: ['google mail'] },
      { text: 'Outlook', rank: 2, points: 2, normalized: 'outlook', aliases: ['outlook.com', 'hotmail'] },
      { text: 'Yahoo Mail', rank: 3, points: 3, normalized: 'yahoo mail', aliases: ['yahoo'] },
      { text: 'iCloud Mail', rank: 4, points: 4, normalized: 'icloud mail', aliases: ['icloud', 'apple mail'] },
      { text: 'Proton Mail', rank: 5, points: 5, normalized: 'proton mail', aliases: ['protonmail'] },
      { text: 'Zoho Mail', rank: 6, points: 6, normalized: 'zoho mail', aliases: ['zoho'] },
      { text: 'AOL Mail', rank: 7, points: 7, normalized: 'aol mail', aliases: ['aol'] },
      { text: 'GMX', rank: 8, points: 8, normalized: 'gmx', aliases: ['gmx mail'] },
      { text: 'Yandex Mail', rank: 9, points: 9, normalized: 'yandex mail', aliases: ['yandex'] },
      { text: 'Tutanota', rank: 10, points: 10, normalized: 'tutanota', aliases: ['tuta'] }
    ]
  },
  {
    id: 'tech-13',
    category: 'Technology',
    title: 'Top 10 most popular smartphone brands in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Samsung', rank: 1, points: 1, normalized: 'samsung', aliases: [] },
      { text: 'Apple', rank: 2, points: 2, normalized: 'apple', aliases: ['iphone'] },
      { text: 'Xiaomi', rank: 3, points: 3, normalized: 'xiaomi', aliases: [] },
      { text: 'Oppo', rank: 4, points: 4, normalized: 'oppo', aliases: [] },
      { text: 'Vivo', rank: 5, points: 5, normalized: 'vivo', aliases: [] },
      { text: 'Transsion', rank: 6, points: 6, normalized: 'transsion', aliases: ['tecno', 'infinix', 'itel'] },
      { text: 'Huawei', rank: 7, points: 7, normalized: 'huawei', aliases: [] },
      { text: 'Realme', rank: 8, points: 8, normalized: 'realme', aliases: [] },
      { text: 'OnePlus', rank: 9, points: 9, normalized: 'oneplus', aliases: ['one plus'] },
      { text: 'Motorola', rank: 10, points: 10, normalized: 'motorola', aliases: ['moto'] }
    ]
  },
  {
    id: 'tech-14',
    category: 'Technology',
    title: 'Top 10 most popular cloud service providers',
    difficulty: 'medium',
    answers: [
      { text: 'Amazon Web Services', rank: 1, points: 1, normalized: 'amazon web services', aliases: ['aws'] },
      { text: 'Microsoft Azure', rank: 2, points: 2, normalized: 'microsoft azure', aliases: ['azure'] },
      { text: 'Google Cloud', rank: 3, points: 3, normalized: 'google cloud', aliases: ['gcp', 'google cloud platform'] },
      { text: 'Alibaba Cloud', rank: 4, points: 4, normalized: 'alibaba cloud', aliases: ['aliyun'] },
      { text: 'IBM Cloud', rank: 5, points: 5, normalized: 'ibm cloud', aliases: ['ibm'] },
      { text: 'Oracle Cloud', rank: 6, points: 6, normalized: 'oracle cloud', aliases: ['oci'] },
      { text: 'Tencent Cloud', rank: 7, points: 7, normalized: 'tencent cloud', aliases: [] },
      { text: 'Huawei Cloud', rank: 8, points: 8, normalized: 'huawei cloud', aliases: [] },
      { text: 'OVHcloud', rank: 9, points: 9, normalized: 'ovhcloud', aliases: ['ovh'] },
      { text: 'DigitalOcean', rank: 10, points: 10, normalized: 'digitalocean', aliases: ['do'] }
    ]
  },
  {
    id: 'tech-15',
    category: 'Technology',
    title: 'Top 10 most popular PC operating systems by market share',
    difficulty: 'easy',
    answers: [
      { text: 'Windows 10', rank: 1, points: 1, normalized: 'windows 10', aliases: ['win 10'] },
      { text: 'Windows 11', rank: 2, points: 2, normalized: 'windows 11', aliases: ['win 11'] },
      { text: 'macOS', rank: 3, points: 3, normalized: 'macos', aliases: ['mac os'] },
      { text: 'Ubuntu', rank: 4, points: 4, normalized: 'ubuntu', aliases: [] },
      { text: 'Linux Mint', rank: 5, points: 5, normalized: 'linux mint', aliases: ['mint'] },
      { text: 'Debian', rank: 6, points: 6, normalized: 'debian', aliases: [] },
      { text: 'Fedora', rank: 7, points: 7, normalized: 'fedora', aliases: [] },
      { text: 'Chrome OS', rank: 8, points: 8, normalized: 'chrome os', aliases: ['chromeos'] },
      { text: 'Red Hat Enterprise Linux', rank: 9, points: 9, normalized: 'red hat enterprise linux', aliases: ['rhel', 'red hat'] },
      { text: 'Arch Linux', rank: 10, points: 10, normalized: 'arch linux', aliases: ['arch'] }
    ]
  },
  {
    id: 'tech-16',
    category: 'Technology',
    title: 'Top 10 most popular databases in the world',
    difficulty: 'hard',
    answers: [
      { text: 'MySQL', rank: 1, points: 1, normalized: 'mysql', aliases: [] },
      { text: 'PostgreSQL', rank: 2, points: 2, normalized: 'postgresql', aliases: ['postgres'] },
      { text: 'SQLite', rank: 3, points: 3, normalized: 'sqlite', aliases: [] },
      { text: 'Oracle Database', rank: 4, points: 4, normalized: 'oracle database', aliases: ['oracle', 'oracle db'] },
      { text: 'Microsoft SQL Server', rank: 5, points: 5, normalized: 'microsoft sql server', aliases: ['mssql', 'sql server'] },
      { text: 'MongoDB', rank: 6, points: 6, normalized: 'mongodb', aliases: ['mongo'] },
      { text: 'Redis', rank: 7, points: 7, normalized: 'redis', aliases: [] },
      { text: 'Elasticsearch', rank: 8, points: 8, normalized: 'elasticsearch', aliases: ['elastic'] },
      { text: 'MariaDB', rank: 9, points: 9, normalized: 'mariadb', aliases: [] },
      { text: 'Cassandra', rank: 10, points: 10, normalized: 'cassandra', aliases: ['apache cassandra'] }
    ]
  },
  {
    id: 'tech-17',
    category: 'Technology',
    title: 'Top 10 most used version control platforms',
    difficulty: 'medium',
    answers: [
      { text: 'GitHub', rank: 1, points: 1, normalized: 'github', aliases: [] },
      { text: 'GitLab', rank: 2, points: 2, normalized: 'gitlab', aliases: [] },
      { text: 'Bitbucket', rank: 3, points: 3, normalized: 'bitbucket', aliases: [] },
      { text: 'Azure DevOps', rank: 4, points: 4, normalized: 'azure devops', aliases: ['azure repos'] },
      { text: 'SourceForge', rank: 5, points: 5, normalized: 'sourceforge', aliases: [] },
      { text: 'Gitea', rank: 6, points: 6, normalized: 'gitea', aliases: [] },
      { text: 'Codeberg', rank: 7, points: 7, normalized: 'codeberg', aliases: [] },
      { text: 'AWS CodeCommit', rank: 8, points: 8, normalized: 'aws codecommit', aliases: ['codecommit'] },
      { text: 'Phabricator', rank: 9, points: 9, normalized: 'phabricator', aliases: [] },
      { text: 'Perforce', rank: 10, points: 10, normalized: 'perforce', aliases: ['p4'] }
    ]
  },
  {
    id: 'tech-18',
    category: 'Technology',
    title: 'Top 10 most popular AI tools in the world',
    difficulty: 'medium',
    answers: [
      { text: 'ChatGPT', rank: 1, points: 1, normalized: 'chatgpt', aliases: ['chat gpt', 'openai'] },
      { text: 'Google Gemini', rank: 2, points: 2, normalized: 'google gemini', aliases: ['gemini', 'bard'] },
      { text: 'Microsoft Copilot', rank: 3, points: 3, normalized: 'microsoft copilot', aliases: ['copilot', 'bing chat'] },
      { text: 'Claude', rank: 4, points: 4, normalized: 'claude', aliases: ['anthropic claude', 'anthropic'] },
      { text: 'Midjourney', rank: 5, points: 5, normalized: 'midjourney', aliases: [] },
      { text: 'DALL·E', rank: 6, points: 6, normalized: 'dall-e', aliases: ['dalle', 'dall e'] },
      { text: 'Stable Diffusion', rank: 7, points: 7, normalized: 'stable diffusion', aliases: [] },
      { text: 'Perplexity', rank: 8, points: 8, normalized: 'perplexity', aliases: ['perplexity ai'] },
      { text: 'Notion AI', rank: 9, points: 9, normalized: 'notion ai', aliases: [] },
      { text: 'Runway', rank: 10, points: 10, normalized: 'runway', aliases: ['runway ml'] }
    ]
  },
  {
    id: 'tech-19',
    category: 'Technology',
    title: 'Top 10 most popular programming frameworks',
    difficulty: 'hard',
    answers: [
      { text: 'React', rank: 1, points: 1, normalized: 'react', aliases: ['reactjs', 'react.js'] },
      { text: 'Angular', rank: 2, points: 2, normalized: 'angular', aliases: ['angularjs'] },
      { text: 'Vue.js', rank: 3, points: 3, normalized: 'vue.js', aliases: ['vue', 'vuejs'] },
      { text: 'Next.js', rank: 4, points: 4, normalized: 'next.js', aliases: ['next', 'nextjs'] },
      { text: 'Django', rank: 5, points: 5, normalized: 'django', aliases: [] },
      { text: 'Flask', rank: 6, points: 6, normalized: 'flask', aliases: [] },
      { text: 'Spring Boot', rank: 7, points: 7, normalized: 'spring boot', aliases: ['spring'] },
      { text: 'Laravel', rank: 8, points: 8, normalized: 'laravel', aliases: [] },
      { text: '.NET', rank: 9, points: 9, normalized: '.net', aliases: ['dotnet', 'asp.net'] },
      { text: 'Ruby on Rails', rank: 10, points: 10, normalized: 'ruby on rails', aliases: ['rails', 'ror'] }
    ]
  },
  {
    id: 'tech-20',
    category: 'Technology',
    title: 'Top 10 most popular messaging apps in the world',
    difficulty: 'easy',
    answers: [
      { text: 'WhatsApp', rank: 1, points: 1, normalized: 'whatsapp', aliases: [] },
      { text: 'WeChat', rank: 2, points: 2, normalized: 'wechat', aliases: ['weixin'] },
      { text: 'Telegram', rank: 3, points: 3, normalized: 'telegram', aliases: [] },
      { text: 'Facebook Messenger', rank: 4, points: 4, normalized: 'facebook messenger', aliases: ['messenger'] },
      { text: 'Snapchat', rank: 5, points: 5, normalized: 'snapchat', aliases: ['snap'] },
      { text: 'Line', rank: 6, points: 6, normalized: 'line', aliases: [] },
      { text: 'Viber', rank: 7, points: 7, normalized: 'viber', aliases: [] },
      { text: 'Discord', rank: 8, points: 8, normalized: 'discord', aliases: [] },
      { text: 'Signal', rank: 9, points: 9, normalized: 'signal', aliases: [] },
      { text: 'KakaoTalk', rank: 10, points: 10, normalized: 'kakaotalk', aliases: ['kakao'] }
    ]
  },

  // Masry Category (Egyptian)
  {
    id: 'masry-1',
    category: 'Masry',
    title: 'Top 10 akla masry (Egyptian food)',
    difficulty: 'easy',
    answers: [
      { text: 'Kofta', rank: 1, points: 1, normalized: 'kofta', aliases: ['kefta', 'kufta'] },
      { text: 'Kabab', rank: 2, points: 2, normalized: 'kabab', aliases: ['kebab'] },
      { text: 'Mahshy', rank: 3, points: 3, normalized: 'mahshy', aliases: ['mahshi', 'stuffed vegetables'] },
      { text: 'Wara2 3enab', rank: 4, points: 4, normalized: 'wara2 3enab', aliases: ['waraq enab', 'grape leaves', 'stuffed grape leaves'] },
      { text: 'Fatta', rank: 5, points: 5, normalized: 'fatta', aliases: ['fattah'] },
      { text: 'Molokheya', rank: 6, points: 6, normalized: 'molokheya', aliases: ['molokhia', 'mulukhiyah'] },
      { text: 'Shawerma', rank: 7, points: 7, normalized: 'shawerma', aliases: ['shawarma', 'shawrma'] },
      { text: '7amam ma7shy', rank: 8, points: 8, normalized: '7amam ma7shy', aliases: ['hamam mahshi', 'stuffed pigeon'] },
      { text: 'Ta3meya', rank: 9, points: 9, normalized: 'ta3meya', aliases: ['taamiya', 'falafel'] },
      { text: 'Fool', rank: 10, points: 10, normalized: 'fool', aliases: ['ful', 'foul', 'fool medames', 'ful medames'] }
    ]
  },
  {
    id: 'masry-2',
    category: 'Masry',
    title: 'Top 10 7elw masry (Egyptian desserts)',
    difficulty: 'easy',
    answers: [
      { text: 'Konafa', rank: 1, points: 1, normalized: 'konafa', aliases: ['kunafa', 'knafeh'] },
      { text: 'Basbousa', rank: 2, points: 2, normalized: 'basbousa', aliases: ['basboosa'] },
      { text: 'Om Ali', rank: 3, points: 3, normalized: 'om ali', aliases: ['umm ali'] },
      { text: 'Katayef', rank: 4, points: 4, normalized: 'katayef', aliases: ['qatayef', 'atayef'] },
      { text: 'Bala7 el sham', rank: 5, points: 5, normalized: 'bala7 el sham', aliases: ['balah el sham'] },
      { text: 'Meshabbek', rank: 6, points: 6, normalized: 'meshabbek', aliases: ['meshabbak', 'mushabak'] },
      { text: 'Ghorayeba', rank: 7, points: 7, normalized: 'ghorayeba', aliases: ['ghraybeh', 'ghorayba'] },
      { text: 'Kahk', rank: 8, points: 8, normalized: 'kahk', aliases: ['kaak', 'eid cookies'] },
      { text: 'Roz bel laban', rank: 9, points: 9, normalized: 'roz bel laban', aliases: ['rice pudding', 'roz be laban'] },
      { text: 'Mehalabeya', rank: 10, points: 10, normalized: 'mehalabeya', aliases: ['muhallabia', 'mahalabia'] }
    ]
  },
  {
    id: 'masry-3',
    category: 'Masry',
    title: 'Top 10 most grossing aflam masry (Egyptian films)',
    difficulty: 'medium',
    answers: [
      { text: 'Welad Rizk 3', rank: 1, points: 1, normalized: 'welad rizk 3', aliases: ['ولاد رزق 3', 'wlad rezk 3'] },
      { text: 'Siko Siko', rank: 2, points: 2, normalized: 'siko siko', aliases: ['سيكو سيكو'] },
      { text: 'Beit El Ruby', rank: 3, points: 3, normalized: 'beit el ruby', aliases: ['بيت الربى', 'beit el roby'] },
      { text: 'El Hareefa 2', rank: 4, points: 4, normalized: 'el hareefa 2', aliases: ['الحريفة 2', 'el 7areefa 2'] },
      { text: 'Kira & El Gin', rank: 5, points: 5, normalized: 'kira el gin', aliases: ['كيرة والجن', 'kira wel gin'] },
      { text: 'Al Mashrue X', rank: 6, points: 6, normalized: 'al mashrue x', aliases: ['المشروع x', 'el mashrou3 x'] },
      { text: 'Blue Elephant 2', rank: 7, points: 7, normalized: 'blue elephant 2', aliases: ['الفيل الأزرق 2', 'el feel el azra2 2'] },
      { text: 'Welad Rizk 2', rank: 8, points: 8, normalized: 'welad rizk 2', aliases: ['ولاد رزق 2', 'wlad rezk 2'] },
      { text: 'Ex Merati', rank: 9, points: 9, normalized: 'ex merati', aliases: ['إكس مراتي', 'ex mrati'] },
      { text: 'Kasablanka', rank: 10, points: 10, normalized: 'kasablanka', aliases: ['كازابلانكا', 'casablanca'] }
    ]
  },
  {
    id: 'masry-4',
    category: 'Masry',
    title: 'Top 10 actresses masry (Egyptian actresses)',
    difficulty: 'medium',
    answers: [
      { text: 'Faten hamama', rank: 1, points: 1, normalized: 'faten hamama', aliases: ['faten 7amama'] },
      { text: 'Mona Zaki', rank: 2, points: 2, normalized: 'mona zaki' },
      { text: 'Yousra', rank: 3, points: 3, normalized: 'yousra', aliases: ['yosra'] },
      { text: 'Nelly Karim', rank: 4, points: 4, normalized: 'nelly karim' },
      { text: 'Menna Shalaby', rank: 5, points: 5, normalized: 'menna shalaby', aliases: ['mena shalabi'] },
      { text: 'Hend Sabry', rank: 6, points: 6, normalized: 'hend sabry', aliases: ['hend sabri'] },
      { text: 'Sherihan', rank: 7, points: 7, normalized: 'sherihan' },
      { text: 'Laila Elwy', rank: 8, points: 8, normalized: 'laila elwy', aliases: ['layla elwi'] },
      { text: 'Sawsan Badr', rank: 9, points: 9, normalized: 'sawsan badr' },
      { text: 'Donia Samir Ghanem', rank: 10, points: 10, normalized: 'donia samir ghanem', aliases: ['donia ghanem'] }
    ]
  },
  {
    id: 'masry-5',
    category: 'Masry',
    title: 'Top 10 mo8aneyen masry (Egyptian singers)',
    difficulty: 'easy',
    answers: [
      { text: 'Amr Diab', rank: 1, points: 1, normalized: 'amr diab', aliases: ['3amr diab'] },
      { text: 'Mohamed Mounir', rank: 2, points: 2, normalized: 'mohamed mounir', aliases: ['mounir', 'el king'] },
      { text: 'Tamer Hosny', rank: 3, points: 3, normalized: 'tamer hosny', aliases: ['tamer hosni'] },
      { text: 'Hamaki', rank: 4, points: 4, normalized: 'hamaki', aliases: ['mohamed hamaki'] },
      { text: 'Mohamed Hamaki', rank: 5, points: 5, normalized: 'mohamed hamaki' },
      { text: 'Ramy Sabry', rank: 6, points: 6, normalized: 'ramy sabry' },
      { text: 'Wael Gassar', rank: 7, points: 7, normalized: 'wael gassar', aliases: ['wael jassar'] },
      { text: 'Mostafa Amar', rank: 8, points: 8, normalized: 'mostafa amar' },
      { text: 'Ahmed Saad', rank: 9, points: 9, normalized: 'ahmed saad' },
      { text: 'Bahaa Sultan', rank: 10, points: 10, normalized: 'bahaa sultan' }
    ]
  },
  {
    id: 'masry-6',
    category: 'Masry',
    title: 'Top 10 moghaneyen sha3by (Sha3by singers)',
    difficulty: 'medium',
    answers: [
      { text: 'Ahmed Adaweya', rank: 1, points: 1, normalized: 'ahmed adaweya', aliases: ['adaweya'] },
      { text: 'Hakim', rank: 2, points: 2, normalized: 'hakim' },
      { text: 'Shaaban Abdel Rehim', rank: 3, points: 3, normalized: 'shaaban abdel rehim', aliases: ['shaaban', 'shaban abdel rahim', 'shaaban abdel ra7im'] },
      { text: 'Essam Sasa', rank: 4, points: 4, normalized: 'essam sasa', aliases: ['3essam sasa'] },
      { text: 'Mahmoud El Leithy', rank: 5, points: 5, normalized: 'mahmoud el leithy', aliases: ['el leithy'] },
      { text: 'Abdel Basset Hamouda', rank: 6, points: 6, normalized: 'abdel basset hamouda' },
      { text: 'Oka w Ortega', rank: 7, points: 7, normalized: 'oka w ortega', aliases: ['oka we ortega', 'okka ortega'] },
      { text: 'Hassan Shakosh', rank: 8, points: 8, normalized: 'hassan shakosh' },
      { text: 'Hamo Beka', rank: 9, points: 9, normalized: 'hamo beka' },
      { text: 'Reda El Bahrawy', rank: 10, points: 10, normalized: 'reda el bahrawy' }
    ]
  },
  {
    id: 'masry-8',
    category: 'Masry',
    title: 'Top 10 football players in Egypt',
    difficulty: 'easy',
    answers: [
      { text: 'Mohamed Salah', rank: 1, points: 1, normalized: 'mohamed salah', aliases: ['salah', 'mo salah'] },
      { text: 'Omar Marmoush', rank: 2, points: 2, normalized: 'omar marmoush', aliases: ['marmoush'] },
      { text: 'Mahmoud El Khatib', rank: 3, points: 3, normalized: 'mahmoud el khatib', aliases: ['el khatib', 'bibo'] },
      { text: 'Mohamed Abou Trika', rank: 4, points: 4, normalized: 'mohamed abou trika', aliases: ['aboutrika', 'abu treika'] },
      { text: 'Hossam Hassan', rank: 5, points: 5, normalized: 'hossam hassan' },
      { text: 'Ahmed Hassan', rank: 6, points: 6, normalized: 'ahmed hassan' },
      { text: 'Essam El Hadary', rank: 7, points: 7, normalized: 'essam el hadary', aliases: ['el hadary', 'hadary'] },
      { text: 'Ramadan Sobhy', rank: 8, points: 8, normalized: 'ramadan sobhy' },
      { text: 'Mohamed Barakat', rank: 9, points: 9, normalized: 'mohamed barakat', aliases: ['barakat'] },
      { text: 'Amr Zaki', rank: 10, points: 10, normalized: 'amr zaki' }
    ]
  },
  {
    id: 'masry-10',
    category: 'Masry',
    title: 'Top 10 sports in Egypt',
    difficulty: 'easy',
    answers: [
      { text: 'Football', rank: 1, points: 1, normalized: 'football', aliases: ['soccer', 'kora'] },
      { text: 'Squash', rank: 2, points: 2, normalized: 'squash' },
      { text: 'Handball', rank: 3, points: 3, normalized: 'handball' },
      { text: 'Basketball', rank: 4, points: 4, normalized: 'basketball' },
      { text: 'Volleyball', rank: 5, points: 5, normalized: 'volleyball' },
      { text: 'Swimming', rank: 6, points: 6, normalized: 'swimming' },
      { text: 'Boxing', rank: 7, points: 7, normalized: 'boxing' },
      { text: 'Wrestling', rank: 8, points: 8, normalized: 'wrestling' },
      { text: 'Karate', rank: 9, points: 9, normalized: 'karate' },
      { text: 'Taekwondo', rank: 10, points: 10, normalized: 'taekwondo' }
    ]
  },
  {
    id: 'masry-11',
    category: 'Masry',
    title: 'Top 10 Egyptian restaurants (local)',
    difficulty: 'medium',
    answers: [
      { text: 'Kasr El Kababgy', rank: 1, points: 1, normalized: 'kasr el kababgy', aliases: ['qasr el kababgy'] },
      { text: 'Sobhy Kaber', rank: 2, points: 2, normalized: 'sobhy kaber' },
      { text: 'El Dahan', rank: 3, points: 3, normalized: 'el dahan' },
      { text: 'El Berens', rank: 4, points: 4, normalized: 'el berens', aliases: ['el brens'] },
      { text: 'Koshary Abou Tarek', rank: 5, points: 5, normalized: 'koshary abou tarek', aliases: ['abou tarek', 'koshari abu tarek'] },
      { text: 'Ibn el Sham', rank: 6, points: 6, normalized: 'ibn el sham', aliases: ['ebn el sham'] },
      { text: 'El falah', rank: 7, points: 7, normalized: 'el falah' },
      { text: 'Hawawshi el rabi3', rank: 8, points: 8, normalized: 'hawawshi el rabi3', aliases: ['hawawshy el rabie'] },
      { text: 'Mohamady', rank: 9, points: 9, normalized: 'mohamady' },
      { text: 'Bahary', rank: 10, points: 10, normalized: 'bahary' }
    ]
  },
  {
    id: 'masry-13',
    category: 'Masry',
    title: 'Top 10 populated places in Egypt',
    difficulty: 'easy',
    answers: [
      { text: 'Cairo', rank: 1, points: 1, normalized: 'cairo', aliases: ['el qahera', 'al qahira'] },
      { text: 'Giza', rank: 2, points: 2, normalized: 'giza', aliases: ['el giza'] },
      { text: 'Alexandria', rank: 3, points: 3, normalized: 'alexandria', aliases: ['alex', 'el eskandereya'] },
      { text: 'Shobra El Kheima', rank: 4, points: 4, normalized: 'shobra el kheima', aliases: ['shubra'] },
      { text: 'Port Said', rank: 5, points: 5, normalized: 'port said', aliases: ['borsaid'] },
      { text: 'Suez', rank: 6, points: 6, normalized: 'suez', aliases: ['el suways'] },
      { text: 'Mansoura', rank: 7, points: 7, normalized: 'mansoura', aliases: ['el mansoura'] },
      { text: 'Tanta', rank: 8, points: 8, normalized: 'tanta' },
      { text: 'Assiut', rank: 9, points: 9, normalized: 'assiut', aliases: ['asyut'] },
      { text: 'Zagazig', rank: 10, points: 10, normalized: 'zagazig' }
    ]
  },
  {
    id: 'masry-14',
    category: 'Masry',
    title: 'Top 10 monuments in Egypt',
    difficulty: 'easy',
    answers: [
      { text: 'Pyramids of Giza', rank: 1, points: 1, normalized: 'pyramids of giza', aliases: ['pyramids', 'el ahramat', 'great pyramid'] },
      { text: 'Sphinx', rank: 2, points: 2, normalized: 'sphinx', aliases: ['el sphinx', 'abu el hol'] },
      { text: 'Luxor Temple', rank: 3, points: 3, normalized: 'luxor temple', aliases: ['luxor'] },
      { text: 'Karnak Temple', rank: 4, points: 4, normalized: 'karnak temple', aliases: ['karnak'] },
      { text: 'Valley of the Kings', rank: 5, points: 5, normalized: 'valley of the kings' },
      { text: 'Abu Simbel', rank: 6, points: 6, normalized: 'abu simbel' },
      { text: 'Egyptian Museum', rank: 7, points: 7, normalized: 'egyptian museum', aliases: ['el mat7af el masry'] },
      { text: 'Citadel of Salah El Din', rank: 8, points: 8, normalized: 'citadel of salah el din', aliases: ['el qal3a', 'saladin citadel'] },
      { text: 'Philae Temple', rank: 9, points: 9, normalized: 'philae temple', aliases: ['philae'] },
      { text: 'Qaitbay Citadel', rank: 10, points: 10, normalized: 'qaitbay citadel', aliases: ['qaitbey', 'kal3et qaitbay'] }
    ]
  },
  {
    id: 'masry-16',
    category: 'Masry',
    title: 'Top 10 scientists in Egypt',
    difficulty: 'hard',
    answers: [
      { text: 'Ahmed Zewail', rank: 1, points: 1, normalized: 'ahmed zewail', aliases: ['zewail'] },
      { text: 'Mostafa Mosharafa', rank: 2, points: 2, normalized: 'mostafa mosharafa', aliases: ['mosharafa'] },
      { text: 'Magdy Yacoub', rank: 3, points: 3, normalized: 'magdy yacoub', aliases: ['magdi yacoub'] },
      { text: 'Farouk El Baz', rank: 4, points: 4, normalized: 'farouk el baz' },
      { text: 'Ali Mostafa Mosharafa', rank: 5, points: 5, normalized: 'ali mostafa mosharafa' },
      { text: 'Mohamed El Sherbiny', rank: 6, points: 6, normalized: 'mohamed el sherbiny' },
      { text: 'Sameera Moussa', rank: 7, points: 7, normalized: 'sameera moussa', aliases: ['samira moussa'] },
      { text: 'Sherif Sedky', rank: 8, points: 8, normalized: 'sherif sedky' },
      { text: 'Hany Azmy', rank: 9, points: 9, normalized: 'hany azmy' },
      { text: 'Adel Mahmoud', rank: 10, points: 10, normalized: 'adel mahmoud' }
    ]
  },
  {
    id: 'masry-17',
    category: 'Masry',
    title: 'Top 10 Egyptian historical figures',
    difficulty: 'medium',
    answers: [
      { text: 'Ramses II', rank: 1, points: 1, normalized: 'ramses ii', aliases: ['ramses', 'ramesses ii'] },
      { text: 'Cleopatra', rank: 2, points: 2, normalized: 'cleopatra' },
      { text: 'Salah El Din', rank: 3, points: 3, normalized: 'salah el din', aliases: ['saladin', 'sala7 el din'] },
      { text: 'Mohamed Ali Pasha', rank: 4, points: 4, normalized: 'mohamed ali pasha', aliases: ['muhammad ali pasha'] },
      { text: 'Gamal Abdel Nasser', rank: 5, points: 5, normalized: 'gamal abdel nasser', aliases: ['nasser', 'abdel nasser'] },
      { text: 'Anwar El Sadat', rank: 6, points: 6, normalized: 'anwar el sadat', aliases: ['sadat'] },
      { text: 'Ahmed Orabi', rank: 7, points: 7, normalized: 'ahmed orabi', aliases: ['orabi'] },
      { text: 'Saad Zaghloul', rank: 8, points: 8, normalized: 'saad zaghloul', aliases: ['zaghloul'] },
      { text: 'Taha Hussein', rank: 9, points: 9, normalized: 'taha hussein', aliases: ['taha hussien'] },
      { text: 'Om Kalthoum', rank: 10, points: 10, normalized: 'om kalthoum', aliases: ['um kulthum', 'oum kalthoum'] }
    ]
  },
  {
    id: 'masry-18',
    category: 'Masry',
    title: 'Top 10 schools in Egypt',
    difficulty: 'hard',
    answers: [
      { text: 'International School of Choueifat', rank: 1, points: 1, normalized: 'international school of choueifat', aliases: ['choueifat', 'isc'] },
      { text: 'British International School (BISC)', rank: 2, points: 2, normalized: 'british international school', aliases: ['bisc'] },
      { text: 'American International School (AIS)', rank: 3, points: 3, normalized: 'american international school', aliases: ['ais'] },
      { text: 'Deutsche Schule der Borromäerinnen', rank: 4, points: 4, normalized: 'deutsche schule der borromaerinen', aliases: ['dsb', 'german school'] },
      { text: 'Lycée Français du Caire', rank: 5, points: 5, normalized: 'lycee francais du caire', aliases: ['french school', 'lycee'] },
      { text: 'Cairo English School', rank: 6, points: 6, normalized: 'cairo english school', aliases: ['ces'] },
      { text: 'Modern English School', rank: 7, points: 7, normalized: 'modern english school', aliases: ['mes'] },
      { text: 'Manaret Heliopolis', rank: 8, points: 8, normalized: 'manaret heliopolis', aliases: ['manara heliopolis'] },
      { text: 'Futures Language School', rank: 9, points: 9, normalized: 'futures language school', aliases: ['futures'] },
      { text: 'Nefertari International School', rank: 10, points: 10, normalized: 'nefertari international school', aliases: ['nefertari'] }
    ]
  },
  {
    id: 'masry-19',
    category: 'Masry',
    title: 'Top 10 mobile apps used in Egypt',
    difficulty: 'easy',
    answers: [
      { text: 'WhatsApp', rank: 1, points: 1, normalized: 'whatsapp' },
      { text: 'Facebook', rank: 2, points: 2, normalized: 'facebook', aliases: ['fb'] },
      { text: 'Instagram', rank: 3, points: 3, normalized: 'instagram', aliases: ['insta', 'ig'] },
      { text: 'TikTok', rank: 4, points: 4, normalized: 'tiktok' },
      { text: 'YouTube', rank: 5, points: 5, normalized: 'youtube', aliases: ['yt'] },
      { text: 'Messenger', rank: 6, points: 6, normalized: 'messenger', aliases: ['fb messenger'] },
      { text: 'Uber', rank: 7, points: 7, normalized: 'uber' },
      { text: 'Careem', rank: 8, points: 8, normalized: 'careem' },
      { text: 'Vodafone Cash', rank: 9, points: 9, normalized: 'vodafone cash', aliases: ['vf cash'] },
      { text: 'Google Maps', rank: 10, points: 10, normalized: 'google maps', aliases: ['maps'] }
    ]
  },
  {
    id: 'masry-20',
    category: 'Masry',
    title: 'Top 10 games played in Egypt',
    difficulty: 'easy',
    answers: [
      { text: 'FIFA / EA FC', rank: 1, points: 1, normalized: 'fifa', aliases: ['ea fc', 'ea sports fc', 'fifa 24'] },
      { text: 'PUBG Mobile', rank: 2, points: 2, normalized: 'pubg mobile', aliases: ['pubg', 'pubg mobile'] },
      { text: 'Free Fire', rank: 3, points: 3, normalized: 'free fire', aliases: ['freefire', 'ff'] },
      { text: 'Call of Duty', rank: 4, points: 4, normalized: 'call of duty', aliases: ['cod', 'warzone'] },
      { text: 'Fortnite', rank: 5, points: 5, normalized: 'fortnite' },
      { text: 'League of Legends', rank: 6, points: 6, normalized: 'league of legends', aliases: ['lol'] },
      { text: 'Valorant', rank: 7, points: 7, normalized: 'valorant' },
      { text: 'GTA V', rank: 8, points: 8, normalized: 'gta v', aliases: ['gta 5', 'grand theft auto'] },
      { text: 'PES', rank: 9, points: 9, normalized: 'pes', aliases: ['efootball', 'pro evolution soccer'] },
      { text: 'Clash of Clans', rank: 10, points: 10, normalized: 'clash of clans', aliases: ['coc'] }
    ]
  }
];

export const getRandomQuestion = (category?: string): GameQuestion => {
  const questions = category ? sampleQuestions.filter(q => q.category === category) : sampleQuestions;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

export const getCategories = (): string[] => {
  return [...new Set(sampleQuestions.map(q => q.category))];
};
