const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const wordsRoutes = require('./routes/words');
const progressRoutes = require('./routes/progress');
const quizRoutes = require('./routes/quiz');
const practiceRoutes = require('./routes/practice');
const statsRoutes = require('./routes/stats');

const PORT = process.argv[2] ? parseInt(process.argv[2], 10) : process.env.PORT || 8023;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/stats', statsRoutes);

app.use(express.static(path.join(__dirname, 'public'), { cacheControl: false }));

app.listen(PORT, () => console.log(`VocabQuest running on http://localhost:${PORT}`));
