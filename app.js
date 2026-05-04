const express = require('express');
require("dotenv").config();
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const session = require('express-session');
const fetch = require("node-fetch");

// 🔹 Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// 🔹 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// 🔹 View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🔹 MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ DB connected'))
.catch(err => console.log('❌ DB Error:', err));

// 🔹 Model
const User = require('./models/user');

// 🔹 Email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ================= ROUTES =================

// Home
app.get('/', (req, res) => {
  res.render('index', { title: 'FestNova' });
});

// Events
app.get('/events', (req, res) => {
  res.render('events', {
    title: 'Events - FestNova',
    subtitle: 'Explore exciting events 🎉'
  });
});

// Register Page
app.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register - FestNova',
    event: req.query.event,
    category: req.query.category
  });
});

// Register POST
app.post('/register', async (req, res) => {

  const {
    name, email, phone, role,
    department, year, teamName, team
  } = req.body;

  const event = req.body.event || req.query.event;
  const category = req.body.category || req.query.category;

  try {

    if (!name || !email || !event) {
      return res.status(400).json({
        success: false,
        message: "❌ Name, Email, and Event are required!"
      });
    }

    const existingUser = await User.findOne({ email, event });

    if (existingUser) {
      return res.json({
        success: false,
        message: "⚠️ Already registered!"
      });
    }

    const user = new User({
      name, email, phone, role,
      department, year, event,
      category, teamName, team
    });

    await user.save();

    // Email
    try {
     await transporter.sendMail({
  from: '"FestNova Team 🎉" <sahasayantika51@gmail.com>',
  to: email,
  subject: "🎉 Registration Successful!",
  html: `
  <div style="font-family:Poppins,sans-serif;padding:20px;">
    
    <h2>Hello ${name} 👋</h2>

    <p>You have successfully registered for:</p>

    <h3 style="color:green;">${event}</h3>

    <p><b>Category:</b> ${category || "General"}</p>
    
    <p><b>Team Name:</b> ${teamName || "Individual"}</p>

    <p><b>Department:</b> ${department || "-"}</p>

    <p><b>Year:</b> ${year || "-"}</p>

    <hr>

    <p>📅 FestNova 2026</p>
    <p>📍 Your College Campus</p>

    <p>We’re excited to have you! 🚀</p>

  </div>
  `
});
    } catch (err) {
      console.log("Email error:", err.message);
    }

    res.json({
      success: true,
      message: "Registration successful! 🎉"
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin
app.get('/admin', async (req, res) => {
  if (!req.session.isAdmin) return res.redirect('/admin-login');
  const users = await User.find().sort({ _id: -1 });
  res.render('admin', { title: "Admin Dashboard", users });
});

// Delete
app.post('/delete/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

// About
app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About - FestNova',
    year: new Date().getFullYear(),
    description1: "FestNova is a dynamic college event platform.",
    description2: "Students can explore & register events.",
    description3: "We simplify event management.",
    description4: "All events in one place.",
    description5: "Showcase your talent 🚀"
  });
});

// ✅ Gallery FIXED
app.get('/gallery', (req, res) => {

  const photos = [
    { src: "images/coding.jpg", category: "tech" },
    { src: "images/music.jpg", category: "music" },
    { src: "images/sports.jpg", category: "sports" },
    { src: "images/game.jpg", category: "gaming" },
    { src: "images/robotics.jpg", category: "tech" },
    { src: "images/sing.jpg", category: "music" },
    { src: "images/debate.jpg", category: "tech" },
    { src: "images/download.jpg", category: "dance" }
  ];

  res.render('gallery', {
    title: 'Gallery - FestNova',
    photos
  });

});

// Contact
app.get('/contact', (req, res) => {
  res.render('contact', {
    title: "Contact - FestNova",
    subtitle: "Get in touch with us 💬",

    email: "festnova@gmail.com",
    phone: "+91 9876543210",
    whatsapp: "+91 9876543210",
    location: "College Campus",

    organizer: "Festnova Team",
    club: "Tech Club",
    organizerPhone: "+91 9999999999",

    year: new Date().getFullYear()
  });
});

// Admin Login
app.get('/admin-login', (req, res) => {
  res.render('admin-login');
});

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.send("❌ Invalid credentials");
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin-login');
});

// Events Pages
app.get("/event/singing", (req, res) => res.render("singing"));
app.get("/event/coding", (req, res) => res.render("coding"));
app.get("/event/dance", (req, res) => res.render("dance"));
app.get("/event/hackathon", (req, res) => res.render("hackathon"));
app.get("/event/music", (req, res) => res.render("music"));
app.get("/event/gaming", (req, res) => res.render("gaming"));
app.get("/event/robotics", (req, res) => res.render("robotics"));
app.get("/event/poster", (req, res) => res.render("poster"));
app.get("/event/debate", (req, res) => res.render("debate"));
app.get("/event/mystic", (req, res) => res.render("mystic"));


  app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `
You are FestNova AI assistant. Answer ONLY based on the information below.

===== FESTNOVA DETAILS =====

🌐 Registration Link:
http://localhost:3000/register

📅 EVENTS LIST:

May 17:
- Coding Competition (10:00 AM - 12:00 PM)
- Dance Competition (2:00 PM - 5:00 PM)
- Hackathon (6:00 PM - 10:00 PM)

May 18:
- Singing Competition (10:00 AM - 12:00 PM)
- Music Competition (1:00 PM - 4:00 PM)
- Gaming Arena (4:00 PM - 7:00 PM)

May 19:
- Robotics Competition (10:00 AM - 2:00 PM)
- Poster Making (2:00 PM - 4:00 PM)
- Debate Competition (4:00 PM - 6:00 PM)
- Mystic Map (6:00 PM - 8:00 PM)

📝 HOW TO PARTICIPATE:
1. Go to the registration page
2. Fill in your name, email, phone
3. Select your event
4. Submit the form
5. You will receive confirmation

===== RULES =====
- Answer ONLY using this data
- Do NOT make up answers
- If answer not found, say: "Please check the website"
- Keep answers short and clear

===== SPECIAL INSTRUCTIONS =====
- If user asks for registration → give the registration link
- If user asks "what events are there" → list all events
- If user asks "how to participate" → explain steps clearly

User Question: ${userMessage}
` }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.error?.message ||
      "No response";

    res.json({ reply });

  } catch (error) {
    console.log("🔥 ERROR:", error);
    res.json({ reply: "AI error" });
  }
});


// 🔹 SERVER (ONLY ONCE)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});