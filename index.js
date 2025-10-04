// Render.com Auto-Ranking Bot for Roblox Hotel Interview System

const express = require('express');
const noblox = require('noblox.js');
const app = express();

app.use(express.json());

// ================================
// CONFIGURATION - CHANGE THESE!
// ================================
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE; // Set in Render environment variables
const GROUP_ID = 435671821; // Your group ID
const TARGET_RANK = 2; // Rank number to promote to (must match Roblox script)

// ================================
// BOT INITIALIZATION
// ================================
async function startBot() {
  try {
    if (!ROBLOX_COOKIE) {
      console.error('❌ ERROR: ROBLOX_COOKIE not found!');
      console.error('Please add your cookie to Render environment variables');
      return;
    }
    
    await noblox.setCookie(ROBLOX_COOKIE);
    const currentUser = await noblox.getCurrentUser();
    console.log(`✅ Logged in as ${currentUser.UserName} (${currentUser.UserID})`);
    console.log(`🏨 Ranking bot is ready for group ${GROUP_ID}`);
    console.log(`📊 Will rank passing players to rank ${TARGET_RANK}`);
  } catch (err) {
    console.error('❌ Failed to login to Roblox:', err.message);
    console.error('Make sure your cookie is valid in environment variables');
  }
}

// Start the bot
startBot();

// ================================
// RANKING ENDPOINT
// ================================
app.post('/rank', async (req, res) => {
  const { userId, username, score, passed, targetRank, groupId } = req.body;
  
  console.log(`📥 Received ranking request for ${username} (${userId})`);
  
  // Validate data
  if (!userId || !username || passed === undefined) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields (userId, username, passed)' 
    });
  }
  
  // Only rank if they passed
  if (!passed) {
    console.log(`⚠️ ${username} did not pass (${score}%)`);
    return res.json({ 
      success: false, 
      message: 'Player did not pass the quiz' 
    });
  }
  
  try {
    // Check current rank
    const currentRank = await noblox.getRankInGroup(GROUP_ID, userId);
    console.log(`📊 ${username} current rank: ${currentRank}`);
    
    if (currentRank >= TARGET_RANK) {
      console.log(`⚠️ ${username} already has rank ${currentRank} (target: ${TARGET_RANK})`);
      return res.json({ 
        success: false, 
        message: 'Player already has required rank or higher',
        currentRank: currentRank
      });
    }
    
    // Promote the player
    console.log(`🔄 Ranking ${username} from ${currentRank} to ${TARGET_RANK}...`);
    await noblox.setRank(GROUP_ID, userId, TARGET_RANK);
    
    console.log(`✅ Successfully ranked ${username} to rank ${TARGET_RANK}!`);
    
    return res.json({ 
      success: true, 
      message: `Successfully ranked ${username} to rank ${TARGET_RANK}`,
      oldRank: currentRank,
      newRank: TARGET_RANK,
      score: score
    });
    
  } catch (err) {
    console.error('❌ Error ranking player:', err.message);
    
    // Check for common errors
    if (err.message.includes('Authorization')) {
      console.error('⚠️ Bot account does not have permission to rank in this group!');
    }
    
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// ================================
// HEALTH CHECK ENDPOINT
// ================================
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Hotel Ranking Bot</title>
        <style>
          body { 
            font-family: Arial; 
            background: #2c3e50; 
            color: white; 
            text-align: center; 
            padding: 50px;
          }
          h1 { color: #3498db; }
          .status { 
            background: #27ae60; 
            padding: 20px; 
            border-radius: 10px; 
            display: inline-block;
            margin: 20px;
          }
        </style>
      </head>
      <body>
        <h1>🏨 Hotel Ranking Bot</h1>
        <div class="status">
          <h2>✅ Bot is Online</h2>
          <p>Group ID: ${GROUP_ID}</p>
          <p>Target Rank: ${TARGET_RANK}</p>
        </div>
        <p>Use POST /rank to rank players</p>
      </body>
    </html>
  `);
});

// ================================
// TEST ENDPOINT (for debugging)
// ================================
app.get('/test', async (req, res) => {
  try {
    const currentUser = await noblox.getCurrentUser();
    res.json({
      status: 'online',
      botUser: currentUser.UserName,
      botUserId: currentUser.UserID,
      groupId: GROUP_ID,
      targetRank: TARGET_RANK
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message
    });
  }
});

// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Ranking bot server started on port ${PORT}`);
  console.log(`🌐 Bot is ready to receive ranking requests!`);
});

// Keep bot alive
setInterval(() => {
  console.log('💓 Bot heartbeat...');
}, 5 * 60 * 1000);
