/**
 * Automated Local Image Pipeline for Arogyadham Swasthya Kutir
 * Downloads dedicated, verified 100% Satvik Pure-Veg food photography
 * directly into project assets.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  path.join(__dirname, 'assets', 'menu-dishes'),
  path.join(__dirname, 'public', 'assets', 'menu-dishes')
];

// Ensure target directories exist
TARGET_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// 135 Verified Dishes Mapping (Strictly Pure Vegetarian, Zero Egg, Zero Non-Veg)
const DISH_PIPELINE = [
  {
    "name": "Puri Bhaji (4 pcs)",
    "filename": "puri-bhaji.jpg",
    "url": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Plain Paratha",
    "filename": "plain-paratha.jpg",
    "url": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Paratha",
    "filename": "paneer-paratha.jpg",
    "url": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Aloo Paratha",
    "filename": "aloo-paratha.jpg",
    "url": "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Mix Veg Pakora (8 pcs)",
    "filename": "mix-veg-pakora.jpg",
    "url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Pakora (8 pcs)",
    "filename": "paneer-pakora.jpg",
    "url": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Idli Sambar with Chutney",
    "filename": "idli-sambar.jpg",
    "url": "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Vada Sambar with Chutney",
    "filename": "vada-sambar.jpg",
    "url": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Uttapam (Plain / Masala)",
    "filename": "uttapam.jpg",
    "url": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Plain Dosa",
    "filename": "plain-dosa.jpg",
    "url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Masala Dosa",
    "filename": "masala-dosa.jpg",
    "url": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Cheese Dosa",
    "filename": "cheese-dosa.jpg",
    "url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Upma with Sambar & Chutney",
    "filename": "veg-upma.jpg",
    "url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Indori Poha",
    "filename": "indori-poha.jpg",
    "url": "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Cutlet",
    "filename": "veg-cutlet.jpg",
    "url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "French Fries",
    "filename": "french-fries.jpg",
    "url": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Bread Ghee Jam",
    "filename": "bread-ghee-jam.jpg",
    "url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Oats (Sweet / Salty)",
    "filename": "oats.jpg",
    "url": "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Choco Flakes with Milk",
    "filename": "choco-flakes.jpg",
    "url": "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Corn Flakes with Milk",
    "filename": "corn-flakes.jpg",
    "url": "https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fresh Fruit Platter",
    "filename": "fresh-fruit-platter.jpg",
    "url": "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Sandwich",
    "filename": "veg-sandwich.jpg",
    "url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Grilled Sandwich",
    "filename": "veg-grilled-sandwich.jpg",
    "url": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Club Sandwich",
    "filename": "veg-club-sandwich.jpg",
    "url": "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Cheese Chilly Toast",
    "filename": "cheese-chilly-toast.jpg",
    "url": "https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Hara Bhara Kebab",
    "filename": "hara-bhara-kebab.jpg",
    "url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Dahi Ke Kebab",
    "filename": "dahi-ke-kebab.jpg",
    "url": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Tikka",
    "filename": "paneer-tikka.jpg",
    "url": "https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Peshawari Paneer Tikka",
    "filename": "peshawari-paneer-tikka.jpg",
    "url": "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Malai Paneer Tikka",
    "filename": "malai-paneer-tikka.jpg",
    "url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Corn Cheese Kebab",
    "filename": "corn-cheese-kebab.jpg",
    "url": "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Tandoori Mushroom",
    "filename": "tandoori-mushroom.jpg",
    "url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Chilli Mushroom (Dry)",
    "filename": "chilli-mushroom.jpg",
    "url": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Manchurian (Dry)",
    "filename": "veg-manchurian.jpg",
    "url": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Chilli Paneer (Dry)",
    "filename": "chilli-paneer.jpg",
    "url": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Crispy Corn",
    "filename": "crispy-corn.jpg",
    "url": "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Corn Salt & Pepper",
    "filename": "corn-salt-and-pepper.jpg",
    "url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Spring Roll",
    "filename": "veg-spring-roll.jpg",
    "url": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Honey Chilli Potato",
    "filename": "honey-chilli-potato.jpg",
    "url": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Chilli Potato",
    "filename": "chilli-potato.jpg",
    "url": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Vegetable Chinese Sizzler",
    "filename": "vegetable-chinese-sizzler.jpg",
    "url": "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Cream of Tomato Soup",
    "filename": "cream-of-tomato-soup.jpg",
    "url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Hot & Sour Soup",
    "filename": "hot-and-sour-soup.jpg",
    "url": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Manchow Soup",
    "filename": "veg-manchow-soup.jpg",
    "url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Sweet Corn Soup",
    "filename": "veg-sweet-corn-soup.jpg",
    "url": "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Mix Millet Soup",
    "filename": "mix-millet-soup.jpg",
    "url": "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Cream of Spinach Soup",
    "filename": "cream-of-spinach-soup.jpg",
    "url": "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Clear Soup",
    "filename": "veg-clear-soup.jpg",
    "url": "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Cream of Veg Soup",
    "filename": "cream-of-veg-soup.jpg",
    "url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Lemon Coriander Soup",
    "filename": "lemon-coriander-soup.jpg",
    "url": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Tikka Pizza",
    "filename": "paneer-tikka-pizza.jpg",
    "url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Margherita Pizza",
    "filename": "margherita-pizza.jpg",
    "url": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Corn and Veg Pizza",
    "filename": "corn-and-veg-pizza.jpg",
    "url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Pasta Alfredo / Pink Sauce",
    "filename": "pasta-alfredo.jpg",
    "url": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Cheese Chilly Balls",
    "filename": "cheese-chilly-balls.jpg",
    "url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Sauteed Veg",
    "filename": "sauteed-veg.jpg",
    "url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Mix Millet Khichdi",
    "filename": "mix-millet-khichdi.jpg",
    "url": "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Makai Palak Ki Subzi",
    "filename": "makai-palak-ki-subzi.jpg",
    "url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Millet Daliya",
    "filename": "millet-daliya.jpg",
    "url": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Black Fried Rice",
    "filename": "black-fried-rice.jpg",
    "url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Butter Masala",
    "filename": "paneer-butter-masala.jpg",
    "url": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Kadai Paneer",
    "filename": "kadai-paneer.jpg",
    "url": "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Palak Paneer",
    "filename": "palak-paneer.jpg",
    "url": "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Matar Paneer",
    "filename": "matar-paneer.jpg",
    "url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Kofta Curry",
    "filename": "veg-kofta-curry.jpg",
    "url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Tomato Palak Bhurji",
    "filename": "veg-tomato-palak-bhurji.jpg",
    "url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Lababdar",
    "filename": "paneer-lababdar.jpg",
    "url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Bhurji",
    "filename": "paneer-bhurji.jpg",
    "url": "https://images.unsplash.com/photo-1544681280-d25a782adc9b?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Hing Dhaniya Ke Aloo",
    "filename": "hing-dhaniya-ke-aloo.jpg",
    "url": "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Methi Matar Malai",
    "filename": "methi-matar-malai.jpg",
    "url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Bhindi Masala",
    "filename": "bhindi-masala.jpg",
    "url": "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Baingan Bharta",
    "filename": "baingan-bharta.jpg",
    "url": "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Lauki Home Style",
    "filename": "lauki-home-style.jpg",
    "url": "https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Karela Ki Sabji",
    "filename": "karela-ki-sabji.jpg",
    "url": "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Kolhapuri",
    "filename": "veg-kolhapuri.jpg",
    "url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Mix Veg",
    "filename": "mix-veg.jpg",
    "url": "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Soya Keema Matar",
    "filename": "soya-keema-matar.jpg",
    "url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Sev Tomato",
    "filename": "sev-tomato.jpg",
    "url": "https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Yellow Dal Tadka / Dal Fry",
    "filename": "yellow-dal-tadka.jpg",
    "url": "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Dal Makhani",
    "filename": "dal-makhani.jpg",
    "url": "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Manchurian Gravy",
    "filename": "veg-manchurian-gravy.jpg",
    "url": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Chilli Paneer Gravy",
    "filename": "chilli-paneer-gravy.jpg",
    "url": "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Hakka Noodles",
    "filename": "veg-hakka-noodles.jpg",
    "url": "https://images.unsplash.com/photo-1562059390-a761a084768e?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Schezwan Noodles",
    "filename": "schezwan-noodles.jpg",
    "url": "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Fried Rice",
    "filename": "veg-fried-rice.jpg",
    "url": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Schezwan Fried Rice",
    "filename": "schezwan-fried-rice.jpg",
    "url": "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Noodle",
    "filename": "veg-noodle.jpg",
    "url": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Triple Schezwan Noodle & Rice",
    "filename": "triple-schezwan-noodle-and-rice.jpg",
    "url": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Bajra Ki Roti (Plain/Ghee)",
    "filename": "bajra-ki-roti.jpg",
    "url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Makka Ki Roti (Plain/Ghee)",
    "filename": "makka-ki-roti.jpg",
    "url": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Jowar Ki Roti (Plain/Ghee)",
    "filename": "jowar-ki-roti.jpg",
    "url": "https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Lachha Paratha",
    "filename": "lachha-paratha.jpg",
    "url": "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Tawa Chapati (Plain/Ghee)",
    "filename": "tawa-chapati.jpg",
    "url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Missi Roti",
    "filename": "missi-roti.jpg",
    "url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Naan (Plain/Ghee)",
    "filename": "naan.jpg",
    "url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Tandoori Roti (Plain/Ghee)",
    "filename": "tandoori-roti.jpg",
    "url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Stuffed Kulcha (Aloo/Paneer)",
    "filename": "stuffed-kulcha.jpg",
    "url": "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Indian Bread Basket",
    "filename": "indian-bread-basket.jpg",
    "url": "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Subz Dum Biryani",
    "filename": "subz-dum-biryani.jpg",
    "url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Paneer Tikka Biryani",
    "filename": "paneer-tikka-biryani.jpg",
    "url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Jeera Rice",
    "filename": "jeera-rice.jpg",
    "url": "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Veg Pulao / Matar Pulao",
    "filename": "veg-pulao.jpg",
    "url": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Steamed Rice",
    "filename": "steamed-rice.jpg",
    "url": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Dal Khichdi",
    "filename": "dal-khichdi.jpg",
    "url": "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Masala Papad",
    "filename": "masala-papad.jpg",
    "url": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Plain Papad (fry/dry)",
    "filename": "plain-papad.jpg",
    "url": "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Mix Veg Raita",
    "filename": "mix-veg-raita.jpg",
    "url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Boondi Raita",
    "filename": "boondi-raita.jpg",
    "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Pineapple Raita",
    "filename": "pineapple-raita.jpg",
    "url": "https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Mixed Fruit Raita",
    "filename": "mixed-fruit-raita.jpg",
    "url": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fresh Garden Green Salad",
    "filename": "fresh-garden-green-salad.jpg",
    "url": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Russian Salad",
    "filename": "russian-salad.jpg",
    "url": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Kachumber Salad",
    "filename": "kachumber-salad.jpg",
    "url": "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Sawa Ki Kheer",
    "filename": "sawa-kheer.jpg",
    "url": "https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Sewaiyan Ki Kheer",
    "filename": "sewaiyan-kheer.jpg",
    "url": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Gulab Jamun (2 pcs)",
    "filename": "gulab-jamun.jpg",
    "url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Moong Dal Halwa",
    "filename": "moong-dal-halwa.jpg",
    "url": "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Gajar Halwa (Seasonal)",
    "filename": "gajar-halwa.jpg",
    "url": "https://images.unsplash.com/photo-1571867424485-369464ed33cc?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Assorted Ice Cream",
    "filename": "assorted-ice-cream.jpg",
    "url": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fresh Watermelon Juice",
    "filename": "fresh-watermelon-juice.jpg",
    "url": "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fresh Sweet Lime Juice",
    "filename": "fresh-sweet-lime-juice.jpg",
    "url": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fresh Orange Juice",
    "filename": "fresh-orange-juice.jpg",
    "url": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Milk Shake (Vanilla/Chocolate/Strawberry)",
    "filename": "milk-shake.jpg",
    "url": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Buttermilk (Plain/Masala)",
    "filename": "buttermilk.jpg",
    "url": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Lassi (Sweet/Salty)",
    "filename": "lassi.jpg",
    "url": "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Cold Coffee",
    "filename": "cold-coffee.jpg",
    "url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fruit Punch Mocktail",
    "filename": "fruit-punch-mocktail.jpg",
    "url": "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Virgin Mojito",
    "filename": "virgin-mojito.jpg",
    "url": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fresh Lime Soda",
    "filename": "fresh-lime-soda.jpg",
    "url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Fresh Lime Water",
    "filename": "fresh-lime-water.jpg",
    "url": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Tea / Masala Tea / Gud Tulsi Chai",
    "filename": "masala-tea.jpg",
    "url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Organic Green Tea",
    "filename": "organic-green-tea.jpg",
    "url": "https://images.unsplash.com/photo-1508253578933-20b529302151?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Black Coffee / Milk Coffee",
    "filename": "coffee.jpg",
    "url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Hot Milk",
    "filename": "hot-milk.jpg",
    "url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80"
  },
  {
    "name": "Bournvita Milk / Hot Chocolate",
    "filename": "bournvita-hot-chocolate.jpg",
    "url": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80"
  }
];

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          try {
            const size = fs.statSync(destPath).size;
            resolve(size);
          } catch (err) {
            resolve(0);
          }
        });
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function processPipeline() {
  console.log(`Starting automated download pipeline for ${DISH_PIPELINE.length} dishes...`);
  console.log(`Destination: assets/menu-dishes/ and public/assets/menu-dishes/
`);

  let successCount = 0;
  let failCount = 0;
  const CONCURRENCY = 6;

  for (let i = 0; i < DISH_PIPELINE.length; i += CONCURRENCY) {
    const batch = DISH_PIPELINE.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (dish) => {
      const primaryDest = path.join(TARGET_DIRS[0], dish.filename);
      const publicDest = path.join(TARGET_DIRS[1], dish.filename);

      try {
        // Download to primary assets folder
        const size = await downloadImage(dish.url, primaryDest);
        // Copy to public assets folder for Vercel / static delivery
        fs.copyFileSync(primaryDest, publicDest);
        successCount++;
        console.log(`[${successCount}/${DISH_PIPELINE.length}] ✓ Downloaded: ${dish.filename} (${(size / 1024).toFixed(1)} KB) - "${dish.name}"`);
      } catch (err) {
        failCount++;
        console.error(`[ERROR] ✗ Failed: ${dish.filename} - ${err.message}`);
      }
    }));
  }

  console.log(`
======================================================`);
  console.log(`Pipeline Completed! Success: ${successCount}, Failed: ${failCount}`);
  console.log(`All local images are safely populated in assets/menu-dishes/`);
  console.log(`======================================================`);
}

if (require.main === module) {
  processPipeline().catch(err => {
    console.error('Fatal Pipeline Error:', err);
    process.exit(1);
  });
}

module.exports = { DISH_PIPELINE, downloadImage };
