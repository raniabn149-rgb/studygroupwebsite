const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(express.json());
app.use(require('cors')());
app.use(express.static(path.join(__dirname)));

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/courses', (req, res) => {
  const db = readDb();
  const lessons = db.lessons.map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    category: lesson.category || 'autre',
    level: lesson.level || 'Tous',
    duration: lesson.duration || 'N/A',
    students: lesson.students || 0,
    image: lesson.image || '📘',
    teacher: lesson.teacherName || 'Professeur',
    description: lesson.description || '',
    source: 'lesson'
  }));
  res.json([...db.courses, ...lessons]);
});

app.get('/api/enrollments', (req, res) => {
  const db = readDb();
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: 'userId requis' });
  }
  const enrollments = db.enrollments.filter(enrollment => enrollment.userId === userId.toString());
  res.json(enrollments);
});

app.post('/api/enrollments', (req, res) => {
  const db = readDb();
  const { userId, courseId } = req.body;
  if (!userId || !courseId) {
    return res.status(400).json({ message: 'userId et courseId requis' });
  }
  const exists = db.enrollments.some(enrollment => enrollment.userId === userId.toString() && enrollment.courseId === courseId.toString());
  if (exists) {
    return res.status(400).json({ message: 'Déjà inscrit à ce cours' });
  }
  const newEnrollment = {
    id: Date.now().toString(),
    userId: userId.toString(),
    courseId: courseId.toString(),
    enrolledAt: new Date().toISOString()
  };
  db.enrollments.push(newEnrollment);
  writeDb(db);
  res.status(201).json(newEnrollment);
});

app.get('/api/teacher-lessons', (req, res) => {
  const db = readDb();
  const teacherId = req.query.teacherId;
  if (!teacherId) {
    return res.status(400).json({ message: 'teacherId requis' });
  }
  const lessons = db.lessons.filter(lesson => lesson.teacherId === teacherId.toString());
  res.json(lessons);
});

app.post('/api/lessons', (req, res) => {
  const db = readDb();
  const lesson = req.body;
  if (!lesson || !lesson.title || !lesson.teacherId) {
    return res.status(400).json({ message: 'Les champs title et teacherId sont requis' });
  }
  const newLesson = {
    id: Date.now().toString(),
    teacherId: lesson.teacherId.toString(),
    teacherName: lesson.teacherName || 'Professeur',
    title: lesson.title,
    description: lesson.description || '',
    videoUrl: lesson.videoUrl || '',
    pdfUrl: lesson.pdfUrl || '',
    category: lesson.category || 'autre',
    duration: lesson.duration || 'N/A',
    students: lesson.students || 0,
    image: lesson.image || '📘',
    createdAt: new Date().toISOString()
  };
  db.lessons.push(newLesson);
  writeDb(db);
  res.status(201).json(newLesson);
});

app.post('/api/users/register', (req, res) => {
  const db = readDb();
  const { firstname, lastname, email, level, role, password } = req.body;
  if (!firstname || !lastname || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }
  const exists = db.users.some(user => user.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ message: 'Cet email est déjà utilisé' });
  }
  const newUser = {
    id: Date.now().toString(),
    firstname,
    lastname,
    email,
    level: level || 'Non spécifié',
    role,
    password,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  writeDb(db);
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ user: userWithoutPassword });
});

app.post('/api/users/login', (req, res) => {
  const db = readDb();
  const { email, password } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
