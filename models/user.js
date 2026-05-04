const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true },
  phone:      { type: String, required: true },
  role:       { type: String, required: true },
  department: { type: String, required: true },
  year:       { type: String },

  event:      { type: String, required: true },

  // ✅ NEW FIELD (event type/category)
  category:   { type: String },

  // ✅ NEW FIELD (team name)
  teamName:   { type: String },

  // existing
  team:       { type: String },

  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);