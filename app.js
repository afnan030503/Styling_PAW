const express = require('express');
const app = express();
const session = require('express-session');
const multer = require('multer');
const path = require('path');

// Setup for Multer to store images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/'); // Store in public/images folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

app.use(express.static("public")); // Serve static files from the public folder

// Endpoint to upload image
app.post('/upload', upload.single('todoImage'), (req, res) => {
    const imageName = req.file.filename; // Get the uploaded image filename
    res.json({ image: imageName }); // Respond with image filename
});

// Filter file yang diizinkan (misalnya hanya gambar)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // File gambar diperbolehkan
    } else {
        cb(new Error('Only image files are allowed!'), false); // Hanya gambar yang diizinkan
    }
};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');

// Middleware untuk mengelola session
app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Halaman Home (harus login)
app.get('/', (req, res) => {
    if (req.session.user) {
        res.render('home', {
            layout: 'layouts/main-layout',
            user: req.session.user // Mengirimkan user ke halaman home
        });
    } else {
        res.redirect('/login');
    }
});

// Halaman Login
app.get('/login', (req, res) => {
    res.render('login');
});

// Logika Login - Mengecek apakah username dan password sesuai
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (req.session.user && req.session.user.username === username && req.session.user.password === password) {
        res.redirect('/');
    } else {
        res.send('Invalid username or password');
    }
});

// Halaman Sign Up
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Logika Signup - Menyimpan username dan password dalam session
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    req.session.user = { username, password };
    res.redirect('/login');
});

// Halaman Todo (harus login)
app.get('/todo', (req, res) => {
    if (req.session.user) {
        res.render('todo', {
            layout: 'layouts/main-layout'
        });
    } else {
        res.redirect('/login');
    }
});

// Logika untuk upload gambar menggunakan Multer
app.post('/todo', upload.single('todoImage'), (req, res) => {
    const { title, description } = req.body;
    const imagePath = '/uploads/' + req.file.filename; // Menyimpan path gambar di server

    // Logika untuk menyimpan data todo ke database atau session
    // Misalnya, kita simpan dalam session sementara
    if (!req.session.todos) {
        req.session.todos = [];
    }
    req.session.todos.push({ title, description, image: imagePath });

    res.redirect('/todo'); // Redirect kembali ke halaman todo setelah menambahkan todo
});

// Route untuk logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login');
    });
});

// Jalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
