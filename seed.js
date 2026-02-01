const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database('./anondate.db');

// Sample data generators
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Cameron', 'Sam',
  'Drew', 'Reese', 'Hayden', 'Skyler', 'Parker', 'Charlie', 'Dakota', 'Emerson', 'Finley', 'Harper',
  'Jesse', 'Kendall', 'Lane', 'Marley', 'Nico', 'Oakley', 'Peyton', 'Remy', 'Sage', 'Tatum',
  'Val', 'Wren', 'Blair', 'Cody', 'Dale', 'Evan', 'Frankie', 'Glen', 'Hunter', 'Ira',
  'Jamie', 'Kai', 'Logan', 'Micah', 'Noel', 'Ollie', 'Pat', 'Robin', 'Shannon', 'Terry'
];

const bios = [
  "Coffee enthusiast and early riser. Looking for someone to share sunrises with.",
  "Bookworm who loves sci-fi and fantasy. Let's debate about Star Wars.",
  "Hiking addict seeking adventure partner. Mountains are calling!",
  "Art lover and museum regular. Looking for creative souls.",
  "Foodie who knows all the best spots in town. Let's explore together.",
  "Music producer by night, barista by day. Vinyl collector.",
  "Yoga instructor seeking zen partner. Namaste 🧘‍♀️",
  "Dog parent to a golden retriever. Must love dogs!",
  "Travel photographer with a passion for street food. 30 countries and counting.",
  "Board game geek and puzzle master. Strategy is my middle name.",
  "Amateur chef who makes a mean pasta. Wine connoisseur in training.",
  "Night owl who loves stargazing and deep conversations.",
  "Fitness enthusiast and marathon runner. Looking for a running buddy.",
  "Introvert who loves cozy nights in with good movies and tea.",
  "Extrovert seeking social adventures. Party animal but responsible.",
  "Plant parent with 50+ houseplants. Green thumb looking for love.",
  "Tech nerd and gamer. Let's team up in CoD or Valorant.",
  "Beach lover and surfer. Sun, sand, and good vibes only.",
  "Poet and hopeless romantic. Looking for my muse.",
  "Entrepreneur building dreams. Seeking supportive partner.",
  "Vintage fashion collector. Thrift store treasure hunter.",
  "DIY enthusiast and home renovator. HGTV fanatic.",
  "Comedy lover and amateur stand-up. I promise I'll make you laugh.",
  "Nature photographer who camps every weekend. Leave no trace!",
  "Karaoke champion and shower singer. Music is life.",
  "History buff and antique collector. Old soul in young body.",
  "Sustainable living advocate. Zero waste and eco-friendly.",
  "Dance instructor (salsa and bachata). Let's dance the night away!",
  "Craft beer enthusiast and brewery hopper. IPA lover.",
  "Film buff with a home theater setup. Movie nights are sacred.",
  "Cat person with two rescues. Independent but affectionate.",
  "Meditation practitioner seeking mindful connection.",
  "Sports fanatic - soccer, basketball, tennis. Play or watch!",
  "Writing a novel in my spare time. Creative writer seeking inspiration.",
  "Architecture student who loves brutalist design. Concrete and glass.",
  "Coffee shop hopper working on my laptop. Digital nomad lifestyle.",
  "Volunteer at animal shelter. Compassionate soul seeking same.",
  "Astronomy nerd with a telescope. Let's look at the stars together.",
  "Indie music scene regular. Concert buddy needed!",
  "Urban gardener growing tomatoes on my balcony. Farm to table!",
  "Classic car restorer. Grease monkey with a heart of gold.",
  "Language learner (Spanish and Japanese). Polyglot in training.",
  "Mental health advocate. Empathetic listener and supportive friend.",
  "Thrifting queen/king. Sustainable fashion is the future.",
  "Rock climber and boulderer. Looking for a belay partner.",
  "Baking wizard specializing in sourdough. Carb lover!",
  "Podcast host talking about true crime. Mystery enthusiast.",
  "Skateboarder and street art lover. Urban explorer.",
  "Meditation and wellness coach. Healthy mind, healthy body.",
  "Mixologist crafting cocktails. Happy hour is my hour."
];

const interestsPool = [
  ['Hiking', 'Nature', 'Photography'],
  ['Reading', 'Coffee', 'Writing'],
  ['Gaming', 'Tech', 'Coding'],
  ['Cooking', 'Wine', 'Foodie'],
  ['Yoga', 'Wellness', 'Meditation'],
  ['Travel', 'Adventure', 'Backpacking'],
  ['Art', 'Museums', 'Gallery'],
  ['Music', 'Concerts', 'Vinyl'],
  ['Fitness', 'Gym', 'Running'],
  ['Movies', 'Cinema', 'Netflix'],
  ['Dogs', 'Pets', 'Animals'],
  ['Cats', 'Books', 'Tea'],
  ['Dancing', 'Salsa', 'Clubbing'],
  ['Beer', 'Brewery', 'Craft'],
  ['Sports', 'Soccer', 'Basketball'],
  ['Board Games', 'Strategy', 'Puzzles'],
  ['Fashion', 'Thrift', 'Vintage'],
  ['Gardening', 'Plants', 'Nature'],
  ['Cosplay', 'Anime', 'Manga'],
  ['DIY', 'Crafts', 'Handmade'],
  ['Comedy', 'Stand-up', 'Theater'],
  ['History', 'Antiques', 'Collecting'],
  ['Sustainability', 'Eco', 'Zero Waste'],
  ['Mental Health', 'Therapy', 'Growth'],
  ['Skating', 'Street Art', 'Urban'],
  ['Baking', 'Desserts', 'Sourdough'],
  ['Podcasts', 'True Crime', 'Mystery'],
  ['Languages', 'Culture', 'Exchange'],
  ['Investing', 'Finance', 'Crypto'],
  ['Space', 'Astronomy', 'Science']
];

const personalityTypes = [
  { ans1: 'adventure', ans2: 'discuss', ans3: 'quality' },
  { ans1: 'cozy', ans2: 'reflect', ans3: 'words' },
  { ans1: 'social', ans2: 'humor', ans3: 'touch' },
  { ans1: 'creative', ans2: 'compromise', ans3: 'gifts' },
  { ans1: 'adventure', ans2: 'reflect', ans3: 'touch' },
  { ans1: 'cozy', ans2: 'discuss', ans3: 'quality' },
  { ans1: 'social', ans2: 'discuss', ans3: 'words' },
  { ans1: 'creative', ans2: 'humor', ans3: 'quality' },
  { ans1: 'adventure', ans2: 'compromise', ans3: 'gifts' },
  { ans1: 'cozy', ans2: 'reflect', ans3: 'touch' },
  { ans1: 'social', ans2: 'humor', ans3: 'quality' },
  { ans1: 'creative', ans2: 'discuss', ans3: 'words' },
  { ans1: 'adventure', ans2: 'humor', ans3: 'touch' },
  { ans1: 'cozy', ans2: 'compromise', ans3: 'gifts' },
  { ans1: 'social', ans2: 'reflect', ans3: 'quality' },
  { ans1: 'creative', ans2: 'discuss', ans3: 'touch' },
  { ans1: 'adventure', ans2: 'reflect', ans3: 'words' },
  { ans1: 'cozy', ans2: 'humor', ans3: 'quality' },
  { ans1: 'social', ans2: 'compromise', ans3: 'gifts' },
  { ans1: 'creative', ans2: 'reflect', ans3: 'touch' },
  { ans1: 'adventure', ans2: 'discuss', ans3: 'words' },
  { ans1: 'cozy', ans2: 'reflect', ans3: 'quality' },
  { ans1: 'social', ans2: 'humor', ans3: 'quality' },
  { ans1: 'creative', ans2: 'discuss', ans3: 'gifts' },
  { ans1: 'adventure', ans2: 'compromise', ans3: 'touch' }
];

const genders = ['male', 'female', 'nonbinary'];
const genderPrefs = ['any', 'male', 'female', 'nonbinary'];
const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Seattle', 'Miami', 'Denver'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const users = [];
  const usedEmails = new Set();
  
  // Generate 50 users
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i];
    const email = `${firstName.toLowerCase()}${getRandomInt(100, 999)}@test.com`;
    
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);
    
    const gender = getRandomItem(genders);
    const age = getRandomInt(21, 45);
    const location = getRandomItem(locations);
    const bio = bios[i];
    const interests = getRandomItem(interestsPool);
    const personality = getRandomItem(personalityTypes);
    const genderPref = getRandomItem(genderPrefs);
    const ageMin = getRandomInt(18, age);
    const ageMax = getRandomInt(age, 60);
    
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    users.push({
      id: userId,
      email: email,
      password: hashedPassword,
      anonName: `${firstName}#${getRandomInt(1000, 9999)}`,
      bio: bio,
      gender: gender,
      age: age,
      location: location,
      interests: interests,
      personality: personality,
      genderPref: genderPref,
      ageMin: ageMin,
      ageMax: ageMax
    });
  }
  
  // Insert into database
  db.serialize(() => {
    // Clear existing test data (optional - remove if you want to keep existing)
    db.run("DELETE FROM messages WHERE 1");
    db.run("DELETE FROM conversations WHERE 1");
    db.run("DELETE FROM blocks WHERE 1");
    db.run("DELETE FROM preferences WHERE 1");
    db.run("DELETE FROM profiles WHERE 1");
    db.run("DELETE FROM users WHERE email LIKE '%@test.com'");
    
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password, created_at, verified, reveal_level)
      VALUES (?, ?, ?, datetime('now'), 1, 0)
    `);
    
    const insertProfile = db.prepare(`
      INSERT INTO profiles (user_id, anon_name, bio, gender, age, location, interests, answers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertPreferences = db.prepare(`
      INSERT INTO preferences (user_id, gender_pref, age_min, age_max, distance_pref)
      VALUES (?, ?, ?, ?, 'any')
    `);
    
    users.forEach((user, index) => {
      // Insert user
      insertUser.run(user.id, user.email, user.password);
      
      // Insert profile
      insertProfile.run(
        user.id,
        user.anonName,
        user.bio,
        user.gender,
        user.age,
        user.location,
        JSON.stringify(user.interests),
        JSON.stringify({
          '1': user.personality.ans1,
          '2': user.personality.ans2,
          '3': user.personality.ans3
        })
      );
      
      // Insert preferences
      insertPreferences.run(
        user.id,
        user.genderPref,
        user.ageMin,
        user.ageMax
      );
      
      console.log(`✅ Created user ${index + 1}/50: ${user.anonName} (${user.gender}, ${user.age})`);
    });
    
    insertUser.finalize();
    insertProfile.finalize();
    insertPreferences.finalize();
    
    console.log('\n🎉 Successfully created 50 dating profiles!');
    console.log('📧 You can log in with any email: password123');
    console.log('\nSample accounts:');
    console.log('  - alex123@test.com : password123');
    console.log('  - jordan456@test.com : password123');
    console.log('  - taylor789@test.com : password123');
    
    db.close();
  });
}

seedDatabase().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});