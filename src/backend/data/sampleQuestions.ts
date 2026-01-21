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
    title: 'Top 10 highest paid athletes in 2024',
    difficulty: 'medium',
    answers: [
      { text: 'Cristiano Ronaldo', rank: 1, points: 1, normalized: 'cristiano ronaldo', aliases: ['ronaldo', 'cr7'] },
      { text: 'Lionel Messi', rank: 2, points: 2, normalized: 'lionel messi', aliases: ['messi'] },
      { text: 'LeBron James', rank: 3, points: 3, normalized: 'lebron james', aliases: ['lebron', 'king james', 'lebron james'] },
      { text: 'Giannis Antetokounmpo', rank: 4, points: 4, normalized: 'giannis antetokounmpo', aliases: ['giannis', 'greek freak'] },
      { text: 'Stephen Curry', rank: 5, points: 5, normalized: 'stephen curry', aliases: ['curry', 'steph'] },
      { text: 'Kevin Durant', rank: 6, points: 6, normalized: 'kevin durant', aliases: ['durant', 'kd'] },
      { text: 'Roger Federer', rank: 7, points: 7, normalized: 'roger federer', aliases: ['federer'] },
      { text: 'Canelo Alvarez', rank: 8, points: 8, normalized: 'canelo alvarez', aliases: ['canelo'] },
      { text: 'Dak Prescott', rank: 9, points: 9, normalized: 'dak prescott', aliases: ['dak'] },
      { text: 'Tom Brady', rank: 10, points: 10, normalized: 'tom brady', aliases: ['brady'] }
    ]
  },
  {
    id: 'sports-2',
    category: 'Sports',
    title: 'Top 10 fastest animals in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Cheetah', rank: 1, points: 1, normalized: 'cheetah' },
      { text: 'Pronghorn Antelope', rank: 2, points: 2, normalized: 'pronghorn antelope', aliases: ['pronghorn'] },
      { text: 'Springbok', rank: 3, points: 3, normalized: 'springbok' },
      { text: 'Wildebeest', rank: 4, points: 4, normalized: 'wildebeest' },
      { text: 'Lion', rank: 5, points: 5, normalized: 'lion' },
      { text: 'Thomson\'s Gazelle', rank: 6, points: 6, normalized: 'thomsons gazelle', aliases: ['gazelle'] },
      { text: 'Quarter Horse', rank: 7, points: 7, normalized: 'quarter horse', aliases: ['quarterhorse'] },
      { text: 'Cape Hunting Dog', rank: 8, points: 8, normalized: 'cape hunting dog', aliases: ['hunting dog'] },
      { text: 'Elk', rank: 9, points: 9, normalized: 'elk' },
      { text: 'Coyote', rank: 10, points: 10, normalized: 'coyote' }
    ]
  },
  {
    id: 'sports-3',
    category: 'Sports',
    title: 'Top 10 most popular sports in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Soccer/Football', rank: 1, points: 1 },
      { text: 'Cricket', rank: 2, points: 2 },
      { text: 'Basketball', rank: 3, points: 3 },
      { text: 'Tennis', rank: 4, points: 4 },
      { text: 'Volleyball', rank: 5, points: 5 },
      { text: 'Table Tennis', rank: 6, points: 6 },
      { text: 'Baseball', rank: 7, points: 7 },
      { text: 'Golf', rank: 8, points: 8 },
      { text: 'American Football', rank: 9, points: 9 },
      { text: 'Rugby', rank: 10, points: 10 }
    ]
  },
  {
    id: 'sports-4',
    category: 'Sports',
    title: 'Top 10 Olympic medal winning countries (all time)',
    difficulty: 'hard',
    answers: [
      { text: 'United States', rank: 1, points: 1 },
      { text: 'Soviet Union', rank: 2, points: 2 },
      { text: 'Germany', rank: 3, points: 3 },
      { text: 'Great Britain', rank: 4, points: 4 },
      { text: 'France', rank: 5, points: 5 },
      { text: 'Italy', rank: 6, points: 6 },
      { text: 'China', rank: 7, points: 7 },
      { text: 'Australia', rank: 8, points: 8 },
      { text: 'Sweden', rank: 9, points: 9 },
      { text: 'Hungary', rank: 10, points: 10 }
    ]
  },
  {
    id: 'sports-5',
    category: 'Sports',
    title: 'Top 10 NBA players with most championships',
    difficulty: 'medium',
    answers: [
      { text: 'Bill Russell', rank: 1, points: 1 },
      { text: 'Sam Jones', rank: 2, points: 2 },
      { text: 'Tom Heinsohn', rank: 3, points: 3 },
      { text: 'K.C. Jones', rank: 4, points: 4 },
      { text: 'Satch Sanders', rank: 5, points: 5 },
      { text: 'John Havlicek', rank: 6, points: 6 },
      { text: 'Jim Loscutoff', rank: 7, points: 7 },
      { text: 'Frank Ramsey', rank: 8, points: 8 },
      { text: 'Robert Horry', rank: 9, points: 9 },
      { text: 'Kareem Abdul-Jabbar', rank: 10, points: 10 }
    ]
  },

  // Movies Category
  {
    id: 'movies-1',
    category: 'Movies',
    title: 'Top 10 highest grossing movies of all time',
    difficulty: 'easy',
    answers: [
      { text: 'Avatar', rank: 1, points: 1 },
      { text: 'Avengers: Endgame', rank: 2, points: 2 },
      { text: 'Titanic', rank: 3, points: 3 },
      { text: 'Star Wars: The Force Awakens', rank: 4, points: 4 },
      { text: 'Avengers: Infinity War', rank: 5, points: 5 },
      { text: 'Spider-Man: No Way Home', rank: 6, points: 6 },
      { text: 'Jurassic World', rank: 7, points: 7 },
      { text: 'The Lion King (2019)', rank: 8, points: 8 },
      { text: 'The Avengers', rank: 9, points: 9 },
      { text: 'Furious 7', rank: 10, points: 10 }
    ]
  },
  {
    id: 'movies-2',
    category: 'Movies',
    title: 'Top 10 best movies according to IMDb',
    difficulty: 'medium',
    answers: [
      { text: 'The Shawshank Redemption', rank: 1, points: 1 },
      { text: 'The Godfather', rank: 2, points: 2 },
      { text: 'The Dark Knight', rank: 3, points: 3 },
      { text: 'The Godfather Part II', rank: 4, points: 4 },
      { text: '12 Angry Men', rank: 5, points: 5 },
      { text: 'Schindler\'s List', rank: 6, points: 6 },
      { text: 'The Lord of the Rings: The Return of the King', rank: 7, points: 7 },
      { text: 'Pulp Fiction', rank: 8, points: 8 },
      { text: 'The Good, the Bad and the Ugly', rank: 9, points: 9 },
      { text: 'Fight Club', rank: 10, points: 10 }
    ]
  },
  {
    id: 'movies-3',
    category: 'Movies',
    title: 'Top 10 most awarded movies at the Oscars',
    difficulty: 'hard',
    answers: [
      { text: 'Ben-Hur (1959)', rank: 1, points: 1 },
      { text: 'Titanic (1997)', rank: 2, points: 2 },
      { text: 'La La Land (2016)', rank: 3, points: 3 },
      { text: 'All About Eve (1950)', rank: 4, points: 4 },
      { text: 'Gone with the Wind (1939)', rank: 5, points: 5 },
      { text: 'From Here to Eternity (1953)', rank: 6, points: 6 },
      { text: 'On the Waterfront (1954)', rank: 7, points: 7 },
      { text: 'My Fair Lady (1964)', rank: 8, points: 8 },
      { text: 'Gigi (1958)', rank: 9, points: 9 },
      { text: 'The Last Emperor (1987)', rank: 10, points: 10 }
    ]
  },
  {
    id: 'movies-4',
    category: 'Movies',
    title: 'Top 10 highest grossing animated movies',
    difficulty: 'easy',
    answers: [
      { text: 'The Lion King (2019)', rank: 1, points: 1 },
      { text: 'Frozen II', rank: 2, points: 2 },
      { text: 'Frozen', rank: 3, points: 3 },
      { text: 'Incredibles 2', rank: 4, points: 4 },
      { text: 'Minions', rank: 5, points: 5 },
      { text: 'Toy Story 4', rank: 6, points: 6 },
      { text: 'Despicable Me 3', rank: 7, points: 7 },
      { text: 'Finding Dory', rank: 8, points: 8 },
      { text: 'Zootopia', rank: 9, points: 9 },
      { text: 'Despicable Me 2', rank: 10, points: 10 }
    ]
  },
  {
    id: 'movies-5',
    category: 'Movies',
    title: 'Top 10 most successful movie franchises',
    difficulty: 'medium',
    answers: [
      { text: 'Marvel Cinematic Universe', rank: 1, points: 1 },
      { text: 'Star Wars', rank: 2, points: 2 },
      { text: 'Harry Potter', rank: 3, points: 3 },
      { text: 'James Bond', rank: 4, points: 4 },
      { text: 'Lord of the Rings', rank: 5, points: 5 },
      { text: 'Fast & Furious', rank: 6, points: 6 },
      { text: 'X-Men', rank: 7, points: 7 },
      { text: 'Batman', rank: 8, points: 8 },
      { text: 'Spider-Man', rank: 9, points: 9 },
      { text: 'Transformers', rank: 10, points: 10 }
    ]
  },

  // Music Category
  {
    id: 'music-1',
    category: 'Music',
    title: 'Top 10 best-selling albums of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Thriller - Michael Jackson', rank: 1, points: 1 },
      { text: 'Back in Black - AC/DC', rank: 2, points: 2 },
      { text: 'The Dark Side of the Moon - Pink Floyd', rank: 3, points: 3 },
      { text: 'The Bodyguard Soundtrack', rank: 4, points: 4 },
      { text: 'Bat Out of Hell - Meat Loaf', rank: 5, points: 5 },
      { text: 'Their Greatest Hits - Eagles', rank: 6, points: 6 },
      { text: 'Saturday Night Fever Soundtrack', rank: 7, points: 7 },
      { text: 'Rumours - Fleetwood Mac', rank: 8, points: 8 },
      { text: 'Grease Soundtrack', rank: 9, points: 9 },
      { text: 'Led Zeppelin IV - Led Zeppelin', rank: 10, points: 10 }
    ]
  },
  {
    id: 'music-2',
    category: 'Music',
    title: 'Top 10 most streamed songs on Spotify',
    difficulty: 'easy',
    answers: [
      { text: 'Blinding Lights - The Weeknd', rank: 1, points: 1 },
      { text: 'Shape of You - Ed Sheeran', rank: 2, points: 2 },
      { text: 'Dance Monkey - Tones and I', rank: 3, points: 3 },
      { text: 'Rockstar - Post Malone', rank: 4, points: 4 },
      { text: 'One Dance - Drake', rank: 5, points: 5 },
      { text: 'Closer - The Chainsmokers', rank: 6, points: 6 },
      { text: 'Thinking Out Loud - Ed Sheeran', rank: 7, points: 7 },
      { text: 'God\'s Plan - Drake', rank: 8, points: 8 },
      { text: 'Havana - Camila Cabello', rank: 9, points: 9 },
      { text: 'Stay - Kid LAROI & Justin Bieber', rank: 10, points: 10 }
    ]
  },
  {
    id: 'music-3',
    category: 'Music',
    title: 'Top 10 most awarded artists at the Grammys',
    difficulty: 'hard',
    answers: [
      { text: 'Georg Solti', rank: 1, points: 1 },
      { text: 'Quincy Jones', rank: 2, points: 2 },
      { text: 'Pierre Boulez', rank: 3, points: 3 },
      { text: 'Alison Krauss', rank: 4, points: 4 },
      { text: 'Chick Corea', rank: 5, points: 5 },
      { text: 'Vladimir Horowitz', rank: 6, points: 6 },
      { text: 'John Williams', rank: 7, points: 7 },
      { text: 'Beyoncé', rank: 8, points: 8 },
      { text: 'Stevie Wonder', rank: 9, points: 9 },
      { text: 'Pat Metheny', rank: 10, points: 10 }
    ]
  },
  {
    id: 'music-4',
    category: 'Music',
    title: 'Top 10 highest paid musicians in 2024',
    difficulty: 'medium',
    answers: [
      { text: 'Taylor Swift', rank: 1, points: 1 },
      { text: 'Beyoncé', rank: 2, points: 2 },
      { text: 'Bruce Springsteen', rank: 3, points: 3 },
      { text: 'Drake', rank: 4, points: 4 },
      { text: 'Ed Sheeran', rank: 5, points: 5 },
      { text: 'The Weeknd', rank: 6, points: 6 },
      { text: 'Bad Bunny', rank: 7, points: 7 },
      { text: 'Post Malone', rank: 8, points: 8 },
      { text: 'Justin Bieber', rank: 9, points: 9 },
      { text: 'Adele', rank: 10, points: 10 }
    ]
  },
  {
    id: 'music-5',
    category: 'Music',
    title: 'Top 10 most popular music genres worldwide',
    difficulty: 'easy',
    answers: [
      { text: 'Pop', rank: 1, points: 1 },
      { text: 'Hip Hop/Rap', rank: 2, points: 2 },
      { text: 'Rock', rank: 3, points: 3 },
      { text: 'Electronic/Dance', rank: 4, points: 4 },
      { text: 'R&B/Soul', rank: 5, points: 5 },
      { text: 'Country', rank: 6, points: 6 },
      { text: 'Latin', rank: 7, points: 7 },
      { text: 'Jazz', rank: 8, points: 8 },
      { text: 'Classical', rank: 9, points: 9 },
      { text: 'Blues', rank: 10, points: 10 }
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

  // History Category
  {
    id: 'history-1',
    category: 'History',
    title: 'Top 10 most important historical events',
    difficulty: 'hard',
    answers: [
      { text: 'World War II', rank: 1, points: 1 },
      { text: 'Industrial Revolution', rank: 2, points: 2 },
      { text: 'American Civil War', rank: 3, points: 3 },
      { text: 'French Revolution', rank: 4, points: 4 },
      { text: 'World War I', rank: 5, points: 5 },
      { text: 'Fall of the Berlin Wall', rank: 6, points: 6 },
      { text: 'Columbus Discovers America', rank: 7, points: 7 },
      { text: 'Declaration of Independence', rank: 8, points: 8 },
      { text: 'Moon Landing', rank: 9, points: 9 },
      { text: '9/11 Attacks', rank: 10, points: 10 }
    ]
  },
  {
    id: 'history-2',
    category: 'History',
    title: 'Top 10 most influential leaders in history',
    difficulty: 'medium',
    answers: [
      { text: 'Jesus Christ', rank: 1, points: 1 },
      { text: 'Muhammad', rank: 2, points: 2 },
      { text: 'Buddha', rank: 3, points: 3 },
      { text: 'Confucius', rank: 4, points: 4 },
      { text: 'St. Paul', rank: 5, points: 5 },
      { text: 'Gutenberg', rank: 6, points: 6 },
      { text: 'Christopher Columbus', rank: 7, points: 7 },
      { text: 'Albert Einstein', rank: 8, points: 8 },
      { text: 'Louis Pasteur', rank: 9, points: 9 },
      { text: 'Galileo Galilei', rank: 10, points: 10 }
    ]
  },
  {
    id: 'history-3',
    category: 'History',
    title: 'Top 10 longest reigning monarchs in history',
    difficulty: 'hard',
    answers: [
      { text: 'Louis XIV of France', rank: 1, points: 1 },
      { text: 'Queen Elizabeth II', rank: 2, points: 2 },
      { text: 'Emperor Hirohito', rank: 3, points: 3 },
      { text: 'King Bhumibol Adulyadej', rank: 4, points: 4 },
      { text: 'Queen Victoria', rank: 5, points: 5 },
      { text: 'King George III', rank: 6, points: 6 },
      { text: 'Emperor Franz Joseph I', rank: 7, points: 7 },
      { text: 'King James I', rank: 8, points: 8 },
      { text: 'King Henry III', rank: 9, points: 9 },
      { text: 'King Edward III', rank: 10, points: 10 }
    ]
  },
  {
    id: 'history-4',
    category: 'History',
    title: 'Top 10 most important inventions in human history',
    difficulty: 'medium',
    answers: [
      { text: 'Wheel', rank: 1, points: 1 },
      { text: 'Writing', rank: 2, points: 2 },
      { text: 'Agriculture', rank: 3, points: 3 },
      { text: 'Printing Press', rank: 4, points: 4 },
      { text: 'Electricity', rank: 5, points: 5 },
      { text: 'Steam Engine', rank: 6, points: 6 },
      { text: 'Telephone', rank: 7, points: 7 },
      { text: 'Automobile', rank: 8, points: 8 },
      { text: 'Computer', rank: 9, points: 9 },
      { text: 'Internet', rank: 10, points: 10 }
    ]
  },
  {
    id: 'history-5',
    category: 'History',
    title: 'Top 10 most significant wars in history',
    difficulty: 'hard',
    answers: [
      { text: 'World War II', rank: 1, points: 1 },
      { text: 'World War I', rank: 2, points: 2 },
      { text: 'American Civil War', rank: 3, points: 3 },
      { text: 'Napoleonic Wars', rank: 4, points: 4 },
      { text: 'Thirty Years\' War', rank: 5, points: 5 },
      { text: 'Hundred Years\' War', rank: 6, points: 6 },
      { text: 'Crusades', rank: 7, points: 7 },
      { text: 'Peloponnesian War', rank: 8, points: 8 },
      { text: 'Punic Wars', rank: 9, points: 9 },
      { text: 'Mongol Conquests', rank: 10, points: 10 }
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

  // Movies & TV Category
  {
    id: 'movies-1',
    category: 'Movies & TV',
    title: 'Top 10 highest-grossing movies of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Avatar', rank: 1, points: 1, normalized: 'avatar' },
      { text: 'Avengers: Endgame', rank: 2, points: 2, aliases: ['endgame', 'avengers endgame'] },
      { text: 'Titanic', rank: 3, points: 3, normalized: 'titanic' },
      { text: 'Star Wars: The Force Awakens', rank: 4, points: 4, aliases: ['force awakens', 'star wars 7'] },
      { text: 'Avengers: Infinity War', rank: 5, points: 5, aliases: ['infinity war', 'avengers 3'] },
      { text: 'Spider-Man: No Way Home', rank: 6, points: 6, aliases: ['no way home', 'spiderman 3'] },
      { text: 'Jurassic World', rank: 7, points: 7, aliases: ['jurassic world'] },
      { text: 'The Lion King', rank: 8, points: 8, aliases: ['lion king'] },
      { text: 'The Avengers', rank: 9, points: 9, aliases: ['avengers'] },
      { text: 'Furious 7', rank: 10, points: 10, aliases: ['fast 7', 'fast and furious 7'] }
    ]
  },
  {
    id: 'movies-2',
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
    id: 'movies-3',
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

  // Masry Category (Egyptian)
  {
    id: 'masry-1',
    category: 'Masry',
    title: 'Top 10 akla masry (Egyptian food)',
    difficulty: 'easy',
    answers: [
      { text: 'Kefta', rank: 1, points: 1, normalized: 'kefta', aliases: ['kofta', 'kufta'] },
      { text: 'Kebab', rank: 2, points: 2, normalized: 'kebab', aliases: ['kabab'] },
      { text: 'Mahshy', rank: 3, points: 3, normalized: 'mahshy', aliases: ['mahshi', 'stuffed vegetables'] },
      { text: 'Wara2 3enab', rank: 4, points: 4, normalized: 'wara2 3enab', aliases: ['waraq enab', 'grape leaves', 'stuffed grape leaves'] },
      { text: 'Fatta', rank: 5, points: 5, normalized: 'fatta', aliases: ['fattah'] },
      { text: 'Molokheya', rank: 6, points: 6, normalized: 'molokheya', aliases: ['molokhia', 'mulukhiyah'] },
      { text: 'Shawerma', rank: 7, points: 7, normalized: 'shawerma', aliases: ['shawarma', 'shawrma'] },
      { text: '7amam ma7shy', rank: 8, points: 8, normalized: '7amam ma7shy', aliases: ['hamam mahshi', 'stuffed pigeon'] },
      { text: 'Falafel', rank: 9, points: 9, normalized: 'falafel', aliases: ['ta3meya', 'taamiya'] },
      { text: 'Fool medames', rank: 10, points: 10, normalized: 'fool medames', aliases: ['ful medames', 'foul', 'ful'] }
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
      { text: 'Qatayef', rank: 4, points: 4, normalized: 'qatayef', aliases: ['katayef', 'atayef'] },
      { text: 'Bala7 el sham', rank: 5, points: 5, normalized: 'bala7 el sham', aliases: ['balah el sham'] },
      { text: 'Meshabbak', rank: 6, points: 6, normalized: 'meshabbak', aliases: ['mushabak'] },
      { text: 'Ghorayeba', rank: 7, points: 7, normalized: 'ghorayeba', aliases: ['ghraybeh', 'ghorayba'] },
      { text: 'Kahk', rank: 8, points: 8, normalized: 'kahk', aliases: ['kaak', 'eid cookies'] },
      { text: 'Roz bel laban', rank: 9, points: 9, normalized: 'roz bel laban', aliases: ['rice pudding', 'roz be laban'] },
      { text: 'Mehalabeya', rank: 10, points: 10, normalized: 'mehalabeya', aliases: ['muhallabia', 'mahalabia'] }
    ]
  },
  {
    id: 'masry-3',
    category: 'Masry',
    title: 'Top 10 aflam masry (Egyptian movies)',
    difficulty: 'medium',
    answers: [
      { text: 'El Ard', rank: 1, points: 1, normalized: 'el ard', aliases: ['the land', 'al ard'] },
      { text: 'El Kit Kat', rank: 2, points: 2, normalized: 'el kit kat', aliases: ['kit kat'] },
      { text: 'Isma3eleyya Raye7 Gay', rank: 3, points: 3, normalized: 'isma3eleyya raye7 gay', aliases: ['ismailia rayeh gay'] },
      { text: '3emaret Y3qobian', rank: 4, points: 4, normalized: '3emaret y3qobian', aliases: ['yacoubian building', 'emaret yaqoubian'] },
      { text: 'El Erhab wel Kabab', rank: 5, points: 5, normalized: 'el erhab wel kabab', aliases: ['terrorism and kabab'] },
      { text: 'El Bedaya', rank: 6, points: 6, normalized: 'el bedaya', aliases: ['the beginning', 'al bidaya'] },
      { text: '3asal Eswed', rank: 7, points: 7, normalized: '3asal eswed', aliases: ['asal aswad', 'molasses'] },
      { text: 'Film Thaqafy', rank: 8, points: 8, normalized: 'film thaqafy', aliases: ['cultural film'] },
      { text: '7een Maysara', rank: 9, points: 9, normalized: '7een maysara', aliases: ['heen maysara'] },
      { text: 'El Feel El Azra2', rank: 10, points: 10, normalized: 'el feel el azra2', aliases: ['the blue elephant', 'el fil el azraq'] }
    ]
  },
  {
    id: 'masry-4',
    category: 'Masry',
    title: 'Top 10 actresses masry (Egyptian actresses)',
    difficulty: 'medium',
    answers: [
      { text: 'Faten 7amama', rank: 1, points: 1, normalized: 'faten 7amama', aliases: ['faten hamama'] },
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
      { text: '3amr Diab', rank: 1, points: 1, normalized: '3amr diab', aliases: ['amr diab'] },
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
    title: 'Top 10 mo8aneyen sha3by (Sha3by singers)',
    difficulty: 'medium',
    answers: [
      { text: 'Ahmed Adaweya', rank: 1, points: 1, normalized: 'ahmed adaweya', aliases: ['adaweya'] },
      { text: 'Hakim', rank: 2, points: 2, normalized: 'hakim' },
      { text: 'Shaaban Abdel Ra7im', rank: 3, points: 3, normalized: 'shaaban abdel ra7im', aliases: ['shaaban', 'shaban abdel rahim'] },
      { text: 'Saad El Soghayar', rank: 4, points: 4, normalized: 'saad el soghayar', aliases: ['saad soghayar'] },
      { text: 'Mahmoud El Leithy', rank: 5, points: 5, normalized: 'mahmoud el leithy', aliases: ['el leithy'] },
      { text: 'Abdel Basset Hamouda', rank: 6, points: 6, normalized: 'abdel basset hamouda' },
      { text: 'Oka w Ortega', rank: 7, points: 7, normalized: 'oka w ortega', aliases: ['oka we ortega', 'okka ortega'] },
      { text: 'Hassan Shakosh', rank: 8, points: 8, normalized: 'hassan shakosh' },
      { text: 'Hamo Beka', rank: 9, points: 9, normalized: 'hamo beka' },
      { text: 'Reda El Bahrawy', rank: 10, points: 10, normalized: 'reda el bahrawy' }
    ]
  },
  {
    id: 'masry-7',
    category: 'Masry',
    title: 'Top 10 mo8aneyen pop masry (Egyptian pop singers)',
    difficulty: 'easy',
    answers: [
      { text: '3amr Diab', rank: 1, points: 1, normalized: '3amr diab', aliases: ['amr diab'] },
      { text: 'Tamer Hosny', rank: 2, points: 2, normalized: 'tamer hosny', aliases: ['tamer hosni'] },
      { text: 'Mohamed Hamaki', rank: 3, points: 3, normalized: 'mohamed hamaki', aliases: ['hamaki'] },
      { text: 'Ramy Sabry', rank: 4, points: 4, normalized: 'ramy sabry' },
      { text: 'Angham', rank: 5, points: 5, normalized: 'angham' },
      { text: 'Sherine', rank: 6, points: 6, normalized: 'sherine', aliases: ['shirine'] },
      { text: 'Ruby', rank: 7, points: 7, normalized: 'ruby' },
      { text: 'Donia Samir Ghanem', rank: 8, points: 8, normalized: 'donia samir ghanem', aliases: ['donia ghanem'] },
      { text: 'Bahaa Sultan', rank: 9, points: 9, normalized: 'bahaa sultan' },
      { text: 'Carmen Soliman', rank: 10, points: 10, normalized: 'carmen soliman' }
    ]
  },
  {
    id: 'masry-8',
    category: 'Masry',
    title: 'Top 10 football players in Egypt',
    difficulty: 'easy',
    answers: [
      { text: 'Mohamed Salah', rank: 1, points: 1, normalized: 'mohamed salah', aliases: ['salah', 'mo salah'] },
      { text: 'Mahmoud El Khatib', rank: 2, points: 2, normalized: 'mahmoud el khatib', aliases: ['el khatib', 'bibo'] },
      { text: 'Mohamed Abou Trika', rank: 3, points: 3, normalized: 'mohamed abou trika', aliases: ['aboutrika', 'abu treika'] },
      { text: 'Hossam Hassan', rank: 4, points: 4, normalized: 'hossam hassan' },
      { text: 'Ahmed Hassan', rank: 5, points: 5, normalized: 'ahmed hassan' },
      { text: 'Essam El Hadary', rank: 6, points: 6, normalized: 'essam el hadary', aliases: ['el hadary', 'hadary'] },
      { text: 'Mohamed El Shenawy', rank: 7, points: 7, normalized: 'mohamed el shenawy', aliases: ['el shenawy'] },
      { text: 'Ramadan Sobhy', rank: 8, points: 8, normalized: 'ramadan sobhy' },
      { text: 'Mohamed Barakat', rank: 9, points: 9, normalized: 'mohamed barakat', aliases: ['barakat'] },
      { text: 'Amr Zaki', rank: 10, points: 10, normalized: 'amr zaki' }
    ]
  },
  {
    id: 'masry-9',
    category: 'Masry',
    title: 'Top 10 Egyptian athletes',
    difficulty: 'medium',
    answers: [
      { text: 'Mohamed Salah', rank: 1, points: 1, normalized: 'mohamed salah', aliases: ['salah'] },
      { text: 'Farida Osman', rank: 2, points: 2, normalized: 'farida osman' },
      { text: 'Hassan El Shorbagy', rank: 3, points: 3, normalized: 'hassan el shorbagy', aliases: ['mohamed el shorbagy'] },
      { text: 'Nour El Sherbiny', rank: 4, points: 4, normalized: 'nour el sherbiny' },
      { text: 'Karam Gaber', rank: 5, points: 5, normalized: 'karam gaber' },
      { text: 'Hady El Gazzar', rank: 6, points: 6, normalized: 'hady el gazzar' },
      { text: 'Ahmed El Gendy', rank: 7, points: 7, normalized: 'ahmed el gendy' },
      { text: 'Sara Samir', rank: 8, points: 8, normalized: 'sara samir' },
      { text: 'Ali Farag', rank: 9, points: 9, normalized: 'ali farag' },
      { text: 'Hamada Helal', rank: 10, points: 10, normalized: 'hamada helal' }
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
      { text: 'Abou El Sid', rank: 1, points: 1, normalized: 'abou el sid', aliases: ['abu el sid'] },
      { text: 'Sobhy Kaber', rank: 2, points: 2, normalized: 'sobhy kaber' },
      { text: 'El Dahan', rank: 3, points: 3, normalized: 'el dahan' },
      { text: 'El Prince', rank: 4, points: 4, normalized: 'el prince' },
      { text: 'Gad', rank: 5, points: 5, normalized: 'gad' },
      { text: 'Zooba', rank: 6, points: 6, normalized: 'zooba' },
      { text: 'Koshary Abou Tarek', rank: 7, points: 7, normalized: 'koshary abou tarek', aliases: ['abou tarek', 'koshari abu tarek'] },
      { text: 'Felfela', rank: 8, points: 8, normalized: 'felfela' },
      { text: 'Qadoura', rank: 9, points: 9, normalized: 'qadoura', aliases: ['kadoura'] },
      { text: 'Abo Ashraf', rank: 10, points: 10, normalized: 'abo ashraf', aliases: ['abu ashraf'] }
    ]
  },
  {
    id: 'masry-12',
    category: 'Masry',
    title: 'Top 10 restaurants in Egypt',
    difficulty: 'medium',
    answers: [
      { text: 'Abou El Sid', rank: 1, points: 1, normalized: 'abou el sid', aliases: ['abu el sid'] },
      { text: 'Sobhy Kaber', rank: 2, points: 2, normalized: 'sobhy kaber' },
      { text: 'El Prince', rank: 3, points: 3, normalized: 'el prince' },
      { text: 'Zooba', rank: 4, points: 4, normalized: 'zooba' },
      { text: 'Koshary Abou Tarek', rank: 5, points: 5, normalized: 'koshary abou tarek', aliases: ['abou tarek'] },
      { text: 'Sequoia', rank: 6, points: 6, normalized: 'sequoia' },
      { text: 'Pier 88', rank: 7, points: 7, normalized: 'pier 88' },
      { text: 'Crimson', rank: 8, points: 8, normalized: 'crimson' },
      { text: 'Kazoku', rank: 9, points: 9, normalized: 'kazoku' },
      { text: 'Andrea', rank: 10, points: 10, normalized: 'andrea' }
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
    id: 'masry-15',
    category: 'Masry',
    title: 'Top 10 TikTokers',
    difficulty: 'medium',
    answers: [
      { text: 'Khaby Lame', rank: 1, points: 1, normalized: 'khaby lame', aliases: ['khaby'] },
      { text: 'Bella Poarch', rank: 2, points: 2, normalized: 'bella poarch' },
      { text: 'Zach King', rank: 3, points: 3, normalized: 'zach king' },
      { text: 'Addison Rae', rank: 4, points: 4, normalized: 'addison rae' },
      { text: 'MrBeast', rank: 5, points: 5, normalized: 'mrbeast', aliases: ['mr beast'] },
      { text: 'Mohamed Shawky', rank: 6, points: 6, normalized: 'mohamed shawky' },
      { text: 'Noor Stars', rank: 7, points: 7, normalized: 'noor stars' },
      { text: 'Ahmed El Sayed', rank: 8, points: 8, normalized: 'ahmed el sayed' },
      { text: 'Youssef Abdelaziz', rank: 9, points: 9, normalized: 'youssef abdelaziz' },
      { text: 'Karim Kamel', rank: 10, points: 10, normalized: 'karim kamel' }
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
