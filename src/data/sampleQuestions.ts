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
      { text: 'Soccer/Football', rank: 1, points: 10 },
      { text: 'Cricket', rank: 2, points: 9 },
      { text: 'Basketball', rank: 3, points: 8 },
      { text: 'Tennis', rank: 4, points: 7 },
      { text: 'Volleyball', rank: 5, points: 6 },
      { text: 'Table Tennis', rank: 6, points: 5 },
      { text: 'Baseball', rank: 7, points: 4 },
      { text: 'Golf', rank: 8, points: 3 },
      { text: 'American Football', rank: 9, points: 2 },
      { text: 'Rugby', rank: 10, points: 1 }
    ]
  },
  {
    id: 'sports-4',
    category: 'Sports',
    title: 'Top 10 Olympic medal winning countries (all time)',
    difficulty: 'hard',
    answers: [
      { text: 'United States', rank: 1, points: 10 },
      { text: 'Soviet Union', rank: 2, points: 9 },
      { text: 'Germany', rank: 3, points: 8 },
      { text: 'Great Britain', rank: 4, points: 7 },
      { text: 'France', rank: 5, points: 6 },
      { text: 'Italy', rank: 6, points: 5 },
      { text: 'China', rank: 7, points: 4 },
      { text: 'Australia', rank: 8, points: 3 },
      { text: 'Sweden', rank: 9, points: 2 },
      { text: 'Hungary', rank: 10, points: 1 }
    ]
  },
  {
    id: 'sports-5',
    category: 'Sports',
    title: 'Top 10 NBA players with most championships',
    difficulty: 'medium',
    answers: [
      { text: 'Bill Russell', rank: 1, points: 10 },
      { text: 'Sam Jones', rank: 2, points: 9 },
      { text: 'Tom Heinsohn', rank: 3, points: 8 },
      { text: 'K.C. Jones', rank: 4, points: 7 },
      { text: 'Satch Sanders', rank: 5, points: 6 },
      { text: 'John Havlicek', rank: 6, points: 5 },
      { text: 'Jim Loscutoff', rank: 7, points: 4 },
      { text: 'Frank Ramsey', rank: 8, points: 3 },
      { text: 'Robert Horry', rank: 9, points: 2 },
      { text: 'Kareem Abdul-Jabbar', rank: 10, points: 1 }
    ]
  },

  // Movies Category
  {
    id: 'movies-1',
    category: 'Movies',
    title: 'Top 10 highest grossing movies of all time',
    difficulty: 'easy',
    answers: [
      { text: 'Avatar', rank: 1, points: 10 },
      { text: 'Avengers: Endgame', rank: 2, points: 9 },
      { text: 'Titanic', rank: 3, points: 8 },
      { text: 'Star Wars: The Force Awakens', rank: 4, points: 7 },
      { text: 'Avengers: Infinity War', rank: 5, points: 6 },
      { text: 'Spider-Man: No Way Home', rank: 6, points: 5 },
      { text: 'Jurassic World', rank: 7, points: 4 },
      { text: 'The Lion King (2019)', rank: 8, points: 3 },
      { text: 'The Avengers', rank: 9, points: 2 },
      { text: 'Furious 7', rank: 10, points: 1 }
    ]
  },
  {
    id: 'movies-2',
    category: 'Movies',
    title: 'Top 10 best movies according to IMDb',
    difficulty: 'medium',
    answers: [
      { text: 'The Shawshank Redemption', rank: 1, points: 10 },
      { text: 'The Godfather', rank: 2, points: 9 },
      { text: 'The Dark Knight', rank: 3, points: 8 },
      { text: 'The Godfather Part II', rank: 4, points: 7 },
      { text: '12 Angry Men', rank: 5, points: 6 },
      { text: 'Schindler\'s List', rank: 6, points: 5 },
      { text: 'The Lord of the Rings: The Return of the King', rank: 7, points: 4 },
      { text: 'Pulp Fiction', rank: 8, points: 3 },
      { text: 'The Good, the Bad and the Ugly', rank: 9, points: 2 },
      { text: 'Fight Club', rank: 10, points: 1 }
    ]
  },
  {
    id: 'movies-3',
    category: 'Movies',
    title: 'Top 10 most awarded movies at the Oscars',
    difficulty: 'hard',
    answers: [
      { text: 'Ben-Hur (1959)', rank: 1, points: 10 },
      { text: 'Titanic (1997)', rank: 2, points: 9 },
      { text: 'La La Land (2016)', rank: 3, points: 8 },
      { text: 'All About Eve (1950)', rank: 4, points: 7 },
      { text: 'Gone with the Wind (1939)', rank: 5, points: 6 },
      { text: 'From Here to Eternity (1953)', rank: 6, points: 5 },
      { text: 'On the Waterfront (1954)', rank: 7, points: 4 },
      { text: 'My Fair Lady (1964)', rank: 8, points: 3 },
      { text: 'Gigi (1958)', rank: 9, points: 2 },
      { text: 'The Last Emperor (1987)', rank: 10, points: 1 }
    ]
  },
  {
    id: 'movies-4',
    category: 'Movies',
    title: 'Top 10 highest grossing animated movies',
    difficulty: 'medium',
    answers: [
      { text: 'The Lion King (2019)', rank: 1, points: 10 },
      { text: 'Frozen II', rank: 2, points: 9 },
      { text: 'Frozen', rank: 3, points: 8 },
      { text: 'Incredibles 2', rank: 4, points: 7 },
      { text: 'Minions', rank: 5, points: 6 },
      { text: 'Toy Story 4', rank: 6, points: 5 },
      { text: 'Despicable Me 3', rank: 7, points: 4 },
      { text: 'Finding Dory', rank: 8, points: 3 },
      { text: 'Zootopia', rank: 9, points: 2 },
      { text: 'Despicable Me 2', rank: 10, points: 1 }
    ]
  },
  {
    id: 'movies-5',
    category: 'Movies',
    title: 'Top 10 most popular movie franchises',
    difficulty: 'easy',
    answers: [
      { text: 'Marvel Cinematic Universe', rank: 1, points: 10 },
      { text: 'Star Wars', rank: 2, points: 9 },
      { text: 'Harry Potter', rank: 3, points: 8 },
      { text: 'James Bond', rank: 4, points: 7 },
      { text: 'Lord of the Rings', rank: 5, points: 6 },
      { text: 'Fast & Furious', rank: 6, points: 5 },
      { text: 'Jurassic Park', rank: 7, points: 4 },
      { text: 'Mission: Impossible', rank: 8, points: 3 },
      { text: 'Batman', rank: 9, points: 2 },
      { text: 'Spider-Man', rank: 10, points: 1 }
    ]
  },

  // Music Category
  {
    id: 'music-1',
    category: 'Music',
    title: 'Top 10 best-selling albums of all time',
    difficulty: 'medium',
    answers: [
      { text: 'Thriller - Michael Jackson', rank: 1, points: 10 },
      { text: 'Back in Black - AC/DC', rank: 2, points: 9 },
      { text: 'The Dark Side of the Moon - Pink Floyd', rank: 3, points: 8 },
      { text: 'The Bodyguard Soundtrack', rank: 4, points: 7 },
      { text: 'Bat Out of Hell - Meat Loaf', rank: 5, points: 6 },
      { text: 'Their Greatest Hits - Eagles', rank: 6, points: 5 },
      { text: 'Saturday Night Fever Soundtrack', rank: 7, points: 4 },
      { text: 'Rumours - Fleetwood Mac', rank: 8, points: 3 },
      { text: 'Grease Soundtrack', rank: 9, points: 2 },
      { text: 'Led Zeppelin IV - Led Zeppelin', rank: 10, points: 1 }
    ]
  },
  {
    id: 'music-2',
    category: 'Music',
    title: 'Top 10 most streamed songs on Spotify',
    difficulty: 'easy',
    answers: [
      { text: 'Blinding Lights - The Weeknd', rank: 1, points: 10 },
      { text: 'Shape of You - Ed Sheeran', rank: 2, points: 9 },
      { text: 'Dance Monkey - Tones and I', rank: 3, points: 8 },
      { text: 'Rockstar - Post Malone', rank: 4, points: 7 },
      { text: 'One Dance - Drake', rank: 5, points: 6 },
      { text: 'Closer - The Chainsmokers', rank: 6, points: 5 },
      { text: 'Thinking Out Loud - Ed Sheeran', rank: 7, points: 4 },
      { text: 'God\'s Plan - Drake', rank: 8, points: 3 },
      { text: 'Havana - Camila Cabello', rank: 9, points: 2 },
      { text: 'Stay - Kid LAROI & Justin Bieber', rank: 10, points: 1 }
    ]
  },
  {
    id: 'music-3',
    category: 'Music',
    title: 'Top 10 most awarded artists at the Grammys',
    difficulty: 'hard',
    answers: [
      { text: 'Georg Solti', rank: 1, points: 10 },
      { text: 'Quincy Jones', rank: 2, points: 9 },
      { text: 'Pierre Boulez', rank: 3, points: 8 },
      { text: 'Alison Krauss', rank: 4, points: 7 },
      { text: 'Chick Corea', rank: 5, points: 6 },
      { text: 'Vladimir Horowitz', rank: 6, points: 5 },
      { text: 'John Williams', rank: 7, points: 4 },
      { text: 'Beyoncé', rank: 8, points: 3 },
      { text: 'Stevie Wonder', rank: 9, points: 2 },
      { text: 'Pat Metheny', rank: 10, points: 1 }
    ]
  },
  {
    id: 'music-4',
    category: 'Music',
    title: 'Top 10 highest paid musicians in 2024',
    difficulty: 'medium',
    answers: [
      { text: 'Taylor Swift', rank: 1, points: 10 },
      { text: 'Beyoncé', rank: 2, points: 9 },
      { text: 'Bruce Springsteen', rank: 3, points: 8 },
      { text: 'Drake', rank: 4, points: 7 },
      { text: 'Ed Sheeran', rank: 5, points: 6 },
      { text: 'The Weeknd', rank: 6, points: 5 },
      { text: 'Bad Bunny', rank: 7, points: 4 },
      { text: 'Post Malone', rank: 8, points: 3 },
      { text: 'Justin Bieber', rank: 9, points: 2 },
      { text: 'Adele', rank: 10, points: 1 }
    ]
  },
  {
    id: 'music-5',
    category: 'Music',
    title: 'Top 10 most popular music genres worldwide',
    difficulty: 'easy',
    answers: [
      { text: 'Pop', rank: 1, points: 10 },
      { text: 'Hip Hop/Rap', rank: 2, points: 9 },
      { text: 'Rock', rank: 3, points: 8 },
      { text: 'Electronic/Dance', rank: 4, points: 7 },
      { text: 'R&B/Soul', rank: 5, points: 6 },
      { text: 'Country', rank: 6, points: 5 },
      { text: 'Latin', rank: 7, points: 4 },
      { text: 'Jazz', rank: 8, points: 3 },
      { text: 'Classical', rank: 9, points: 2 },
      { text: 'Blues', rank: 10, points: 1 }
    ]
  },

  // Science Category
  {
    id: 'science-1',
    category: 'Science',
    title: 'Top 10 most important scientific discoveries',
    difficulty: 'hard',
    answers: [
      { text: 'Theory of Relativity', rank: 1, points: 10 },
      { text: 'DNA Structure', rank: 2, points: 9 },
      { text: 'Penicillin', rank: 3, points: 8 },
      { text: 'Gravity', rank: 4, points: 7 },
      { text: 'Evolution by Natural Selection', rank: 5, points: 6 },
      { text: 'Quantum Mechanics', rank: 6, points: 5 },
      { text: 'Vaccination', rank: 7, points: 4 },
      { text: 'Electricity', rank: 8, points: 3 },
      { text: 'Periodic Table', rank: 9, points: 2 },
      { text: 'Germ Theory', rank: 10, points: 1 }
    ]
  },
  {
    id: 'science-2',
    category: 'Science',
    title: 'Top 10 largest planets in our solar system',
    difficulty: 'medium',
    answers: [
      { text: 'Jupiter', rank: 1, points: 10 },
      { text: 'Saturn', rank: 2, points: 9 },
      { text: 'Uranus', rank: 3, points: 8 },
      { text: 'Neptune', rank: 4, points: 7 },
      { text: 'Earth', rank: 5, points: 6 },
      { text: 'Venus', rank: 6, points: 5 },
      { text: 'Mars', rank: 7, points: 4 },
      { text: 'Mercury', rank: 8, points: 3 },
      { text: 'Pluto (dwarf planet)', rank: 9, points: 2 },
      { text: 'Eris (dwarf planet)', rank: 10, points: 1 }
    ]
  },
  {
    id: 'science-3',
    category: 'Science',
    title: 'Top 10 most endangered animal species',
    difficulty: 'medium',
    answers: [
      { text: 'Javan Rhino', rank: 1, points: 10 },
      { text: 'Vaquita', rank: 2, points: 9 },
      { text: 'Sumatran Rhino', rank: 3, points: 8 },
      { text: 'Amur Leopard', rank: 4, points: 7 },
      { text: 'Mountain Gorilla', rank: 5, points: 6 },
      { text: 'South China Tiger', rank: 6, points: 5 },
      { text: 'Sumatran Elephant', rank: 7, points: 4 },
      { text: 'Bornean Orangutan', rank: 8, points: 3 },
      { text: 'Hawksbill Sea Turtle', rank: 9, points: 2 },
      { text: 'Black Rhino', rank: 10, points: 1 }
    ]
  },
  {
    id: 'science-4',
    category: 'Science',
    title: 'Top 10 most important inventions of the 20th century',
    difficulty: 'medium',
    answers: [
      { text: 'Internet', rank: 1, points: 10 },
      { text: 'Personal Computer', rank: 2, points: 9 },
      { text: 'Mobile Phone', rank: 3, points: 8 },
      { text: 'Television', rank: 4, points: 7 },
      { text: 'Airplane', rank: 5, points: 6 },
      { text: 'Penicillin', rank: 6, points: 5 },
      { text: 'Nuclear Power', rank: 7, points: 4 },
      { text: 'Space Travel', rank: 8, points: 3 },
      { text: 'DNA Sequencing', rank: 9, points: 2 },
      { text: 'Laser', rank: 10, points: 1 }
    ]
  },
  {
    id: 'science-5',
    category: 'Science',
    title: 'Top 10 smartest animals in the world',
    difficulty: 'easy',
    answers: [
      { text: 'Chimpanzee', rank: 1, points: 10 },
      { text: 'Dolphin', rank: 2, points: 9 },
      { text: 'Elephant', rank: 3, points: 8 },
      { text: 'Octopus', rank: 4, points: 7 },
      { text: 'Crow', rank: 5, points: 6 },
      { text: 'Pig', rank: 6, points: 5 },
      { text: 'Dog', rank: 7, points: 4 },
      { text: 'Cat', rank: 8, points: 3 },
      { text: 'Horse', rank: 9, points: 2 },
      { text: 'Raccoon', rank: 10, points: 1 }
    ]
  },

  // History Category
  {
    id: 'history-1',
    category: 'History',
    title: 'Top 10 most important historical events',
    difficulty: 'hard',
    answers: [
      { text: 'World War II', rank: 1, points: 10 },
      { text: 'Industrial Revolution', rank: 2, points: 9 },
      { text: 'American Civil War', rank: 3, points: 8 },
      { text: 'French Revolution', rank: 4, points: 7 },
      { text: 'World War I', rank: 5, points: 6 },
      { text: 'Fall of the Berlin Wall', rank: 6, points: 5 },
      { text: 'Columbus Discovers America', rank: 7, points: 4 },
      { text: 'Declaration of Independence', rank: 8, points: 3 },
      { text: 'Moon Landing', rank: 9, points: 2 },
      { text: '9/11 Attacks', rank: 10, points: 1 }
    ]
  },
  {
    id: 'history-2',
    category: 'History',
    title: 'Top 10 most influential leaders in history',
    difficulty: 'medium',
    answers: [
      { text: 'Jesus Christ', rank: 1, points: 10 },
      { text: 'Muhammad', rank: 2, points: 9 },
      { text: 'Buddha', rank: 3, points: 8 },
      { text: 'Confucius', rank: 4, points: 7 },
      { text: 'St. Paul', rank: 5, points: 6 },
      { text: 'Gutenberg', rank: 6, points: 5 },
      { text: 'Christopher Columbus', rank: 7, points: 4 },
      { text: 'Albert Einstein', rank: 8, points: 3 },
      { text: 'Louis Pasteur', rank: 9, points: 2 },
      { text: 'Galileo Galilei', rank: 10, points: 1 }
    ]
  },
  {
    id: 'history-3',
    category: 'History',
    title: 'Top 10 longest reigning monarchs in history',
    difficulty: 'hard',
    answers: [
      { text: 'Louis XIV of France', rank: 1, points: 10 },
      { text: 'Queen Elizabeth II', rank: 2, points: 9 },
      { text: 'Emperor Hirohito', rank: 3, points: 8 },
      { text: 'King Bhumibol Adulyadej', rank: 4, points: 7 },
      { text: 'Queen Victoria', rank: 5, points: 6 },
      { text: 'King George III', rank: 6, points: 5 },
      { text: 'Emperor Franz Joseph I', rank: 7, points: 4 },
      { text: 'King James I', rank: 8, points: 3 },
      { text: 'King Henry III', rank: 9, points: 2 },
      { text: 'King Edward III', rank: 10, points: 1 }
    ]
  },
  {
    id: 'history-4',
    category: 'History',
    title: 'Top 10 most important inventions in human history',
    difficulty: 'medium',
    answers: [
      { text: 'Wheel', rank: 1, points: 10 },
      { text: 'Writing', rank: 2, points: 9 },
      { text: 'Agriculture', rank: 3, points: 8 },
      { text: 'Printing Press', rank: 4, points: 7 },
      { text: 'Electricity', rank: 5, points: 6 },
      { text: 'Steam Engine', rank: 6, points: 5 },
      { text: 'Telephone', rank: 7, points: 4 },
      { text: 'Automobile', rank: 8, points: 3 },
      { text: 'Computer', rank: 9, points: 2 },
      { text: 'Internet', rank: 10, points: 1 }
    ]
  },
  {
    id: 'history-5',
    category: 'History',
    title: 'Top 10 most significant wars in history',
    difficulty: 'hard',
    answers: [
      { text: 'World War II', rank: 1, points: 10 },
      { text: 'World War I', rank: 2, points: 9 },
      { text: 'American Civil War', rank: 3, points: 8 },
      { text: 'Napoleonic Wars', rank: 4, points: 7 },
      { text: 'Thirty Years\' War', rank: 5, points: 6 },
      { text: 'Hundred Years\' War', rank: 6, points: 5 },
      { text: 'Crusades', rank: 7, points: 4 },
      { text: 'Peloponnesian War', rank: 8, points: 3 },
      { text: 'Punic Wars', rank: 9, points: 2 },
      { text: 'Mongol Conquests', rank: 10, points: 1 }
    ]
  },

  // Geography Category
  {
    id: 'geography-1',
    category: 'Geography',
    title: 'Top 10 largest countries by land area',
    difficulty: 'easy',
    answers: [
      { text: 'Russia', rank: 1, points: 10 },
      { text: 'Canada', rank: 2, points: 9 },
      { text: 'China', rank: 3, points: 8 },
      { text: 'United States', rank: 4, points: 7 },
      { text: 'Brazil', rank: 5, points: 6 },
      { text: 'Australia', rank: 6, points: 5 },
      { text: 'India', rank: 7, points: 4 },
      { text: 'Argentina', rank: 8, points: 3 },
      { text: 'Kazakhstan', rank: 9, points: 2 },
      { text: 'Algeria', rank: 10, points: 1 }
    ]
  },
  {
    id: 'geography-2',
    category: 'Geography',
    title: 'Top 10 most populated countries in the world',
    difficulty: 'easy',
    answers: [
      { text: 'China', rank: 1, points: 10 },
      { text: 'India', rank: 2, points: 9 },
      { text: 'United States', rank: 3, points: 8 },
      { text: 'Indonesia', rank: 4, points: 7 },
      { text: 'Pakistan', rank: 5, points: 6 },
      { text: 'Brazil', rank: 6, points: 5 },
      { text: 'Nigeria', rank: 7, points: 4 },
      { text: 'Bangladesh', rank: 8, points: 3 },
      { text: 'Russia', rank: 9, points: 2 },
      { text: 'Mexico', rank: 10, points: 1 }
    ]
  },
  {
    id: 'geography-3',
    category: 'Geography',
    title: 'Top 10 tallest mountains in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Mount Everest', rank: 1, points: 10 },
      { text: 'K2', rank: 2, points: 9 },
      { text: 'Kangchenjunga', rank: 3, points: 8 },
      { text: 'Lhotse', rank: 4, points: 7 },
      { text: 'Makalu', rank: 5, points: 6 },
      { text: 'Cho Oyu', rank: 6, points: 5 },
      { text: 'Dhaulagiri', rank: 7, points: 4 },
      { text: 'Manaslu', rank: 8, points: 3 },
      { text: 'Nanga Parbat', rank: 9, points: 2 },
      { text: 'Annapurna I', rank: 10, points: 1 }
    ]
  },
  {
    id: 'geography-4',
    category: 'Geography',
    title: 'Top 10 largest cities by population',
    difficulty: 'medium',
    answers: [
      { text: 'Tokyo', rank: 1, points: 10 },
      { text: 'Delhi', rank: 2, points: 9 },
      { text: 'Shanghai', rank: 3, points: 8 },
      { text: 'São Paulo', rank: 4, points: 7 },
      { text: 'Mexico City', rank: 5, points: 6 },
      { text: 'Cairo', rank: 6, points: 5 },
      { text: 'Mumbai', rank: 7, points: 4 },
      { text: 'Beijing', rank: 8, points: 3 },
      { text: 'Dhaka', rank: 9, points: 2 },
      { text: 'Osaka', rank: 10, points: 1 }
    ]
  },
  {
    id: 'geography-5',
    category: 'Geography',
    title: 'Top 10 longest rivers in the world',
    difficulty: 'medium',
    answers: [
      { text: 'Nile', rank: 1, points: 10 },
      { text: 'Amazon', rank: 2, points: 9 },
      { text: 'Yangtze', rank: 3, points: 8 },
      { text: 'Mississippi-Missouri', rank: 4, points: 7 },
      { text: 'Yenisei', rank: 5, points: 6 },
      { text: 'Yellow River', rank: 6, points: 5 },
      { text: 'Ob-Irtysh', rank: 7, points: 4 },
      { text: 'Paraná', rank: 8, points: 3 },
      { text: 'Congo', rank: 9, points: 2 },
      { text: 'Amur', rank: 10, points: 1 }
    ]
  }
];

export const getQuestionsByCategory = (category: string): GameQuestion[] => {
  return sampleQuestions.filter(question => question.category === category);
};

export const getRandomQuestion = (category?: string): GameQuestion => {
  const questions = category ? getQuestionsByCategory(category) : sampleQuestions;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

export const getCategories = (): string[] => {
  return [...new Set(sampleQuestions.map(q => q.category))];
};
